import { Router } from "express";
import { loginHandler, meHandler, refreshHandler } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(loginHandler));
router.post("/refresh", asyncHandler(refreshHandler));
router.get("/me", requireAuth, asyncHandler(meHandler));

export default router;
