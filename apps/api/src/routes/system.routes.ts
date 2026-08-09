import { Router } from "express";
import { checkUncontactedLeadsHandler } from "@/controllers/system.controller";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Triggered periodically by an external scheduler (n8n cron) — authenticated via x-n8n-api-key.
router.post("/check-uncontacted-leads", asyncHandler(checkUncontactedLeadsHandler));

export default router;
