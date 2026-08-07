export interface SendMessageInput {
  to: string;
  body: string;
}

export interface SendMediaInput {
  to: string;
  mediaUrl: string;
  caption?: string;
}

export interface WhatsAppSendResult {
  providerMessageId: string;
}

export interface WhatsAppProvider {
  sendMessage(input: SendMessageInput): Promise<WhatsAppSendResult>;
  sendMedia(input: SendMediaInput): Promise<WhatsAppSendResult>;
}
