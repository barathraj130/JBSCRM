import type { Response } from "express";
import { z } from "zod";
import * as followUpService from "@/services/followUp.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

const createSchema = z.object({
  leadId: z.string().min(1),
  dueAt: z.string().datetime().or(z.string().min(1)),
  notes: z.string().optional(),
});

export async function createHandler(req: AuthedRequest, res: Response) {
  const input = createSchema.parse(req.body);
  const followUp = await followUpService.createFollowUp(req.user!, input.leadId, new Date(input.dueAt), input.notes);
  res.status(201).json(followUp);
}

const completeSchema = z.object({ outcome: z.string().optional(), evidenceImageUrl: z.string().optional() });

export async function completeHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing follow-up id");
  const { outcome, evidenceImageUrl } = completeSchema.parse(req.body);
  const followUp = await followUpService.completeFollowUp(req.user!, req.params.id, outcome, evidenceImageUrl);
  res.json(followUp);
}
