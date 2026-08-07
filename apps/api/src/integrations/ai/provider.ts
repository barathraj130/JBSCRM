export interface AIProvider {
  suggestReply(conversation: string, context?: string): Promise<string>;
  summarizeConversation(conversation: string): Promise<string>;
  translate(text: string, targetLanguage: "en" | "ta" | "hi"): Promise<string>;
  detectSentiment(text: string): Promise<"positive" | "neutral" | "negative">;
  recommendProducts(customerMessage: string, availableCategories: string[]): Promise<string[]>;
  nextBestAction(leadSummary: string): Promise<string>;
}
