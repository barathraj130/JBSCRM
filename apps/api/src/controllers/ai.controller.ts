import type { Response } from "express";
import { z } from "zod";
import * as aiService from "@/services/ai.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

function customerId(req: AuthedRequest): string {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  return req.params.id;
}

export async function suggestReplyHandler(req: AuthedRequest, res: Response) {
  res.json(await aiService.suggestReply(req.user!, customerId(req)));
}

export async function summarizeHandler(req: AuthedRequest, res: Response) {
  res.json(await aiService.summarizeConversation(req.user!, customerId(req)));
}

export async function sentimentHandler(req: AuthedRequest, res: Response) {
  res.json(await aiService.detectSentiment(req.user!, customerId(req)));
}

export async function nextBestActionHandler(req: AuthedRequest, res: Response) {
  res.json(await aiService.nextBestAction(req.user!, customerId(req)));
}

const translateSchema = z.object({
  text: z.string().min(1),
  targetLanguage: z.enum(["en", "ta", "hi"]),
});

export async function translateHandler(req: AuthedRequest, res: Response) {
  const { text, targetLanguage } = translateSchema.parse(req.body);
  res.json(await aiService.translate(text, targetLanguage));
}
