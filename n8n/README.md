# n8n workflow — WhatsApp inbound automation

`whatsapp-inbound-workflow.json` implements the real-world side of the automation described in the root [README](../README.md#whatsapp-automation-n8n): it receives inbound WhatsApp messages from Meta's WhatsApp Business Cloud API and hands them to the CRM's `/api/webhooks/whatsapp-inbound` endpoint, which does the intent detection, catalog matching, and auto-reply.

## What it does

| Path | Purpose |
|---|---|
| `GET /webhook/whatsapp-inbound` | Meta's one-time webhook verification handshake — checks `hub.verify_token`, echoes back `hub.challenge` |
| `POST /webhook/whatsapp-inbound` | Actual inbound message events. Extracts `from` (phone) and the message text from Meta's payload, skips non-text/non-message events, and forwards `{ phone, body }` to the CRM |

The CRM call is authenticated with the `x-n8n-api-key` header, matching `N8N_API_KEY` in `apps/api/.env`.

## Import

1. In n8n: **Workflows → Import from File** → select `whatsapp-inbound-workflow.json`.
2. Set these environment variables on your n8n instance (Settings → Environment Variables, or however your n8n deployment injects them):

   | Variable | Value |
   |---|---|
   | `CRM_API_URL` | The CRM API's public URL, e.g. `https://api.yourdomain.com` |
   | `CRM_N8N_API_KEY` | Same value as `N8N_API_KEY` in `apps/api/.env` |
   | `WHATSAPP_VERIFY_TOKEN` | Any string you choose — used only for Meta's webhook verification handshake |

3. Activate the workflow. n8n will expose it at `https://<your-n8n-host>/webhook/whatsapp-inbound`.
4. In the Meta developer dashboard (WhatsApp Business API product), set that URL as the webhook callback, use the same `WHATSAPP_VERIFY_TOKEN`, and subscribe to the `messages` field.

## Testing without a real WhatsApp Business account

You don't need any of the above to see the automation work — the CRM's **Customer 360 → WhatsApp tab** has a "Simulate an incoming customer message" box that calls the same underlying pipeline directly, without n8n or Meta involved. This workflow file is for when you're ready to wire up a real WhatsApp Business number.
