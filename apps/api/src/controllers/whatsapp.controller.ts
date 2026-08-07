import type { Response } from "express";
import { z } from "zod";
import * as whatsappService from "@/services/whatsappAutomation.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

const sendSchema = z.object({ body: z.string().min(1) });

export async function sendHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const { body } = sendSchema.parse(req.body);
  const message = await whatsappService.sendManualMessage(req.user!, req.params.id, body);
  res.status(201).json(message);
}

const simulateSchema = z.object({ body: z.string().min(1) });

export async function simulateInboundHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const { body } = simulateSchema.parse(req.body);
  const result = await whatsappService.processInboundMessage(req.user!, req.params.id, body);
  res.status(201).json(result);
}

const webhookSchema = z.object({ phone: z.string().min(1), body: z.string().min(1) });

export async function webhookInboundHandler(req: AuthedRequest, res: Response) {
  whatsappService.verifyN8nApiKey(req.headers["x-n8n-api-key"] as string | undefined);
  const { phone, body } = webhookSchema.parse(req.body);
  const customer = await whatsappService.findCustomerByPhoneOrThrow(phone);
  const result = await whatsappService.processInboundMessage(null, customer.id, body);
  res.status(201).json(result);
}
