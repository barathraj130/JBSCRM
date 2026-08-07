import { Router } from "express";
import { summaryHandler } from "@/controllers/dashboard.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.get("/summary", requireAuth, asyncHandler(summaryHandler));

export default router;
