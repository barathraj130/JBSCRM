import type { Request, Response } from "express";
import * as indiamartLeadService from "@/services/indiamartLead.service";

export async function indiamartLeadWebhookHandler(req: Request, res: Response) {
  indiamartLeadService.verifyIndiaMartApiKey(req.headers["x-indiamart-api-key"] as string | undefined);
  const lead = await indiamartLeadService.importIndiaMartLead(req.body as Record<string, unknown>);
  res.status(201).json(lead);
}
