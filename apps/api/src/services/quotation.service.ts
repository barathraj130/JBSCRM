import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toQuotationDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { generateQuotationPdf } from "@/lib/pdf";
import { storageProvider } from "@/lib/storage";
import { whatsappProvider } from "@/integrations/whatsapp";
import type { CreateQuotationInput } from "@indiamart-crm/shared";
import type { Prisma } from "@prisma/client";

const quotationInclude = { customer: true, createdBy: true, items: true } satisfies Prisma.QuotationInclude;

async function assertCustomerAccess(actor: RequestingUser, customerId: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, include: { leads: true } });
  if (!customer) throw new HttpError(404, "Customer not found");
  if (visibleUserIds && !customer.leads.some((l) => l.assignedToId && visibleUserIds.includes(l.assignedToId))) {
    throw new HttpError(403, "You do not have access to this customer");
  }
  return customer;
}

export async function listQuotations(actor: RequestingUser, customerId?: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const where: Prisma.QuotationWhereInput = {};
  if (customerId) where.customerId = customerId;
  if (visibleUserIds) where.createdById = { in: visibleUserIds };

  const quotations = await prisma.quotation.findMany({ where, include: quotationInclude, orderBy: { createdAt: "desc" } });
  return quotations.map(toQuotationDTO);
}

export async function getQuotation(actor: RequestingUser, id: string) {
  const quotation = await prisma.quotation.findUnique({ where: { id }, include: quotationInclude });
  if (!quotation) throw new HttpError(404, "Quotation not found");
  const visibleUserIds = await getVisibleUserIds(actor);
  if (visibleUserIds && !visibleUserIds.includes(quotation.createdById)) {
    throw new HttpError(403, "You do not have access to this quotation");
  }
  return quotation;
}

export async function getQuotationDetail(actor: RequestingUser, id: string) {
  const quotation = await getQuotation(actor, id);
  return toQuotationDTO(quotation);
}

function computeTotal(items: CreateQuotationInput["items"], discount: number, gstPercent: number) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxable = subtotal - discount;
  return taxable + (taxable * gstPercent) / 100;
}

export async function createQuotation(actor: RequestingUser, input: CreateQuotationInput) {
  await assertCustomerAccess(actor, input.customerId);
  if (input.items.length === 0) {
    throw new HttpError(400, "A quotation needs at least one item");
  }

  const discount = input.discount ?? 0;
  const gstPercent = input.gstPercent ?? 18;
  const total = computeTotal(input.items, discount, gstPercent);

  const quotation = await prisma.quotation.create({
    data: {
      customerId: input.customerId,
      leadId: input.leadId,
      createdById: actor.id,
      discount,
      gstPercent,
      total,
      items: {
        create: input.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: quotationInclude,
  });

  await logActivity("customer", input.customerId, actor.id, "quotation_created", { quotationId: quotation.id, total });

  return toQuotationDTO(quotation);
}

export async function getQuotationPdf(actor: RequestingUser, id: string): Promise<{ buffer: Buffer; dto: ReturnType<typeof toQuotationDTO> }> {
  const quotation = await getQuotation(actor, id);
  const dto = toQuotationDTO(quotation);
  const buffer = await generateQuotationPdf(dto);
  return { buffer, dto };
}

export async function sendQuotationViaWhatsApp(actor: RequestingUser, id: string) {
  const quotation = await getQuotation(actor, id);
  const dto = toQuotationDTO(quotation);
  const buffer = await generateQuotationPdf(dto);
  const { url } = await storageProvider.saveFile(buffer, `quotation-${id}.pdf`);

  await prisma.quotation.update({ where: { id }, data: { pdfUrl: url, status: "SENT" } });

  await whatsappProvider.sendMedia({
    to: quotation.customer.phone,
    mediaUrl: url,
    caption: `Quotation from JBS Knit Wear — Total: Rs. ${dto.total.toLocaleString("en-IN")}`,
  });

  await prisma.whatsAppMessage.create({
    data: {
      customerId: quotation.customerId,
      direction: "OUTBOUND",
      body: `Quotation sent (Rs. ${dto.total.toLocaleString("en-IN")})`,
      mediaUrl: url,
      sentById: actor.id,
    },
  });

  await logActivity("customer", quotation.customerId, actor.id, "quotation_sent_whatsapp", { quotationId: id });

  return { pdfUrl: url };
}
