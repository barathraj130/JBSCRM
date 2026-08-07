import { env } from "@/lib/env";
import { HttpError } from "@/middleware/errorHandler";
import type { AIProvider } from "./provider";
import { ClaudeAIProvider } from "./claudeProvider";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!env.anthropicApiKey) {
    throw new HttpError(503, "AI_NOT_CONFIGURED");
  }
  if (!cached) {
    cached = new ClaudeAIProvider();
  }
  return cached;
}

export type { AIProvider } from "./provider";
