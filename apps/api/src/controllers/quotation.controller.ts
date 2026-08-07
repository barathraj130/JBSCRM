import type { Response } from "express";
import { z } from "zod";
import * as quotationService from "@/services/quotation.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

export async function listHandler(req: AuthedRequest, res: Response) {
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  const quotations = await quotationService.listQuotations(req.user!, customerId);
  res.json(quotations);
}

export async function getHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing quotation id");
  const quotation = await quotationService.getQuotationDetail(req.user!, req.params.id);
  res.json(quotation);
}

const createSchema = z.object({
  customerId: z.string().min(1),
  leadId: z.string().optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        name: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
});

export async function createHandler(req: AuthedRequest, res: Response) {
  const input = createSchema.parse(req.body);
  const quotation = await quotationService.createQuotation(req.user!, input);
  res.status(201).json(quotation);
}

export async function pdfHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing quotation id");
  const { buffer, dto } = await quotationService.getQuotationPdf(req.user!, req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="quotation-${dto.id.slice(-8)}.pdf"`);
  res.send(buffer);
}

export async function sendWhatsAppHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing quotation id");
  const result = await quotationService.sendQuotationViaWhatsApp(req.user!, req.params.id);
  res.json(result);
}
