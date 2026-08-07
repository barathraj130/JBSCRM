import { Router } from "express";
import { webhookInboundHandler } from "@/controllers/whatsapp.controller";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Called by n8n after it receives an inbound WhatsApp message — authenticated via x-n8n-api-key, not a user JWT.
router.post("/whatsapp-inbound", asyncHandler(webhookInboundHandler));

export default router;
