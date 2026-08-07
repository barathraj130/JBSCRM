import { Router } from "express";
import { completeHandler, createHandler } from "@/controllers/followUp.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(createHandler));
router.patch("/:id/complete", asyncHandler(completeHandler));

export default router;
