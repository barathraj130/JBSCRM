import { Router } from "express";
import { createHandler, getHandler, listHandler, pdfHandler, sendWhatsAppHandler } from "@/controllers/quotation.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHandler));
router.post("/", asyncHandler(createHandler));
router.get("/:id", asyncHandler(getHandler));
router.get("/:id/pdf", asyncHandler(pdfHandler));
router.post("/:id/send-whatsapp", asyncHandler(sendWhatsAppHandler));

export default router;
