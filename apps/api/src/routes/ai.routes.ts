import { Router } from "express";
import {
  nextBestActionHandler,
  sentimentHandler,
  suggestReplyHandler,
  summarizeHandler,
  translateHandler,
} from "@/controllers/ai.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/customers/:id/suggest-reply", asyncHandler(suggestReplyHandler));
router.post("/customers/:id/summarize", asyncHandler(summarizeHandler));
router.post("/customers/:id/sentiment", asyncHandler(sentimentHandler));
router.post("/customers/:id/next-best-action", asyncHandler(nextBestActionHandler));
router.post("/translate", asyncHandler(translateHandler));

export default router;
