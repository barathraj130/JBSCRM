import { Router } from "express";
import { listHandler, markAllReadHandler, markReadHandler } from "@/controllers/notification.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHandler));
router.patch("/read-all", asyncHandler(markAllReadHandler));
router.patch("/:id/read", asyncHandler(markReadHandler));

export default router;
