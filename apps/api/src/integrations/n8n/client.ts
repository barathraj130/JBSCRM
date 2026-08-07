import { env } from "@/lib/env";

export interface N8nInboundWhatsAppPayload {
  from: string;
  body: string;
  mediaUrl?: string;
}

export async function notifyN8n(event: string, payload: unknown): Promise<void> {
  if (!env.n8nWebhookUrl) {
    console.log(`[n8n] webhook not configured, skipping event "${event}"`);
    return;
  }

  await fetch(env.n8nWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  }).catch((err) => {
    console.error(`[n8n] failed to notify webhook:`, err);
  });
}
