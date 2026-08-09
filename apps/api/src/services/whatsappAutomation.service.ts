import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { assertCustomerAccess } from "@/services/customer.service";
import { type RequestingUser } from "@/utils/leadScope";
import { toWhatsAppMessageDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { createNotification } from "@/services/notification.service";
import { recordEvidence } from "@/services/evidence.service";
import { findCatalogForCategoryNames } from "@/services/catalog.service";
import { whatsappProvider } from "@/integrations/whatsapp";
import { getAIProvider } from "@/integrations/ai";
import { notifyN8n } from "@/integrations/n8n/client";
import { HttpError } from "@/middleware/errorHandler";
import type { Customer, Prisma } from "@prisma/client";

type WhatsAppMessageWithSentBy = Prisma.WhatsAppMessageGetPayload<{ include: { sentBy: true } }>;

function absoluteUrl(url: string) {
  return url.startsWith("http") ? url : `${env.apiPublicUrl}${url}`;
}

async function detectCategories(body: string, availableCategories: string[]): Promise<string[]> {
  if (availableCategories.length === 0) return [];

  try {
    const ai = getAIProvider();
    const matched = await ai.recommendProducts(body, availableCategories);
    const normalized = matched.map((m) => m.toLowerCase());
    return availableCategories.filter((c) => normalized.some((m) => m.includes(c.toLowerCase()) || c.toLowerCase().includes(m)));
  } catch {
    const words = body.toLowerCase();
    return availableCategories.filter((c) => words.includes(c.toLowerCase()));
  }
}

export async function sendManualMessage(actor: RequestingUser, customerId: string, body: string) {
  const customer = await assertCustomerAccess(actor, customerId);

  await whatsappProvider.sendMessage({ to: customer.phone, body });

  const message = await prisma.whatsAppMessage.create({
    data: { customerId, direction: "OUTBOUND", body, sentById: actor.id },
    include: { sentBy: true },
  });

  await logActivity("customer", customerId, actor.id, "whatsapp_message_sent");
  await recordEvidence({
    customerId,
    employeeId: actor.id,
    type: "WHATSAPP_MESSAGE_SENT",
    status: "VERIFIED",
    refType: "WhatsAppMessage",
    refId: message.id,
  });

  return toWhatsAppMessageDTO(message);
}

export async function processInboundMessage(actor: RequestingUser | null, customerId: string, body: string) {
  const customer = actor ? await assertCustomerAccess(actor, customerId) : await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });

  const inbound = await prisma.whatsAppMessage.create({
    data: { customerId, direction: "INBOUND", body },
    include: { sentBy: true },
  });
  await logActivity("customer", customerId, null, "whatsapp_message_received", { body });
  await recordEvidence({
    customerId,
    employeeId: null,
    type: "WHATSAPP_MESSAGE_RECEIVED",
    status: "VERIFIED",
    refType: "WhatsAppMessage",
    refId: inbound.id,
  });

  const assignedLead = await prisma.lead.findFirst({ where: { customerId, assignedToId: { not: null } }, orderBy: { createdAt: "desc" } });
  const respondingEmployeeId = assignedLead?.assignedToId ?? null;

  if (respondingEmployeeId) {
    await createNotification(respondingEmployeeId, "CUSTOMER_REPLY", `Customer replied: ${customer.name}`, {
      body,
      entityType: "customer",
      entityId: customerId,
    });
  }

  const outboundRecords: WhatsAppMessageWithSentBy[] = [];

  const categoryNames = (await prisma.category.findMany({ select: { name: true } })).map((c) => c.name);
  const matchedCategories = await detectCategories(body, categoryNames);
  const catalog = await findCatalogForCategoryNames(matchedCategories);
  const products = catalog?.products.map((cp) => cp.product) ?? [];

  async function sendAndLog(kind: "text" | "media", content: { body: string; mediaUrl?: string }, catalogId?: string) {
    if (kind === "media" && content.mediaUrl) {
      await whatsappProvider.sendMedia({ to: customer.phone, mediaUrl: absoluteUrl(content.mediaUrl), caption: content.body });
    } else {
      await whatsappProvider.sendMessage({ to: customer.phone, body: content.body });
    }
    const record = await prisma.whatsAppMessage.create({
      data: { customerId, direction: "OUTBOUND", body: content.body, mediaUrl: content.mediaUrl, sentById: null, catalogId },
      include: { sentBy: true },
    });
    outboundRecords.push(record);
    await recordEvidence({
      customerId,
      leadId: assignedLead?.id ?? null,
      employeeId: respondingEmployeeId,
      type: "WHATSAPP_MESSAGE_SENT",
      status: "VERIFIED",
      refType: "WhatsAppMessage",
      refId: record.id,
    });
  }

  if (catalog && products.length > 0) {
    for (const product of products.slice(0, 2)) {
      if (product.images[0]) {
        await sendAndLog("media", { body: product.name, mediaUrl: product.images[0] }, catalog.id);
      }
    }
    const brochure = products.find((p) => p.brochureUrl);
    if (brochure?.brochureUrl) {
      await sendAndLog("media", { body: `${brochure.name} brochure`, mediaUrl: brochure.brochureUrl }, catalog.id);
    }
    const priceList = products.map((p) => `${p.name} — Rs. ${Number(p.price).toLocaleString("en-IN")}`).join("\n");
    await sendAndLog("text", { body: `Here's what we have in ${catalog.name}:\n${priceList}` }, catalog.id);

    await logActivity("customer", customerId, null, "whatsapp_auto_catalog_sent", {
      matchedCategories,
      catalogId: catalog.id,
      productIds: products.map((p) => p.id),
    });
    await recordEvidence({
      customerId,
      leadId: assignedLead?.id ?? null,
      employeeId: respondingEmployeeId,
      type: "CATALOG_SENT",
      status: "VERIFIED",
      refType: "Catalog",
      refId: catalog.id,
      metadata: { matchedCategories, productIds: products.map((p) => p.id) },
    });
  } else {
    await sendAndLog("text", {
      body: "Thanks for reaching out! Could you tell us a bit more about what you're looking for so we can help?",
    });
    await logActivity("customer", customerId, null, "whatsapp_auto_reply_fallback", { body });
  }

  await notifyN8n("whatsapp_message_processed", {
    customerId,
    inboundBody: body,
    matchedCategories,
    catalogId: catalog?.id ?? null,
    productsSent: products.map((p) => p.id),
  });

  return {
    inbound: toWhatsAppMessageDTO(inbound),
    outbound: outboundRecords.map(toWhatsAppMessageDTO),
  };
}

export function verifyN8nApiKey(providedKey: string | undefined): void {
  if (!env.n8nApiKey) {
    throw new HttpError(501, "n8n webhook is not configured (set N8N_API_KEY)");
  }
  if (providedKey !== env.n8nApiKey) {
    throw new HttpError(401, "Invalid n8n API key");
  }
}

export async function findCustomerByPhoneOrThrow(phone: string): Promise<Customer> {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) throw new HttpError(404, "No customer found with that phone number");
  return customer;
}
