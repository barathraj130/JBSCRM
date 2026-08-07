import { Router } from "express";
import { sendHandler, simulateInboundHandler } from "@/controllers/whatsapp.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/customers/:id/send", asyncHandler(sendHandler));
router.post("/customers/:id/simulate-inbound", asyncHandler(simulateInboundHandler));

export default router;
