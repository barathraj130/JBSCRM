import type { SendMediaInput, SendMessageInput, WhatsAppProvider, WhatsAppSendResult } from "./provider";

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(input: SendMessageInput): Promise<WhatsAppSendResult> {
    console.log(`[MockWhatsApp] -> ${input.to}: ${input.body}`);
    return { providerMessageId: `mock_${Date.now()}` };
  }

  async sendMedia(input: SendMediaInput): Promise<WhatsAppSendResult> {
    console.log(`[MockWhatsApp] -> ${input.to}: media ${input.mediaUrl} (${input.caption ?? ""})`);
    return { providerMessageId: `mock_${Date.now()}` };
  }
}
