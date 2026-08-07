import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { AIProvider } from "./provider";

export class ClaudeAIProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: env.anthropicApiKey });
    this.model = env.aiModel;
  }

  private async ask(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block?.type === "text" ? block.text : "";
  }

  async suggestReply(conversation: string, context?: string): Promise<string> {
    return this.ask(
      `You are a sales assistant for an IndiaMART seller. Given this WhatsApp conversation, suggest the single best next reply.\n\nContext: ${context ?? "none"}\n\nConversation:\n${conversation}\n\nReply with only the suggested message text.`
    );
  }

  async summarizeConversation(conversation: string): Promise<string> {
    return this.ask(`Summarize this WhatsApp sales conversation in 2-3 sentences:\n\n${conversation}`);
  }

  async translate(text: string, targetLanguage: "en" | "ta" | "hi"): Promise<string> {
    const languageNames = { en: "English", ta: "Tamil", hi: "Hindi" };
    return this.ask(`Translate the following text to ${languageNames[targetLanguage]}. Return only the translation:\n\n${text}`);
  }

  async detectSentiment(text: string): Promise<"positive" | "neutral" | "negative"> {
    const result = await this.ask(
      `Classify the sentiment of this customer message as exactly one word: positive, neutral, or negative.\n\nMessage: ${text}`
    );
    const normalized = result.trim().toLowerCase();
    if (normalized.includes("positive")) return "positive";
    if (normalized.includes("negative")) return "negative";
    return "neutral";
  }

  async recommendProducts(customerMessage: string, availableCategories: string[]): Promise<string[]> {
    const result = await this.ask(
      `A customer said: "${customerMessage}". Available product categories: ${availableCategories.join(", ")}. List the most relevant categories (comma-separated, no explanation).`
    );
    return result
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  async nextBestAction(leadSummary: string): Promise<string> {
    return this.ask(`Given this lead's summary, suggest the single next best action for the sales rep in one short sentence:\n\n${leadSummary}`);
  }
}
