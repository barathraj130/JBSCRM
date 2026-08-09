import { Router } from "express";
import { webhookInboundHandler } from "@/controllers/whatsapp.controller";
import { indiamartLeadWebhookHandler } from "@/controllers/indiamart.controller";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Called by n8n after it receives an inbound WhatsApp message — authenticated via x-n8n-api-key, not a user JWT.
router.post("/whatsapp-inbound", asyncHandler(webhookInboundHandler));

// Called directly by IndiaMART's Lead Manager Push API (or n8n relaying it) — authenticated via x-indiamart-api-key.
router.post("/indiamart-lead", asyncHandler(indiamartLeadWebhookHandler));

export default router;
