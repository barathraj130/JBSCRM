import { Router } from "express";
import { listHandler } from "@/controllers/auditLog.controller";
import { requireAuth, requireCapability } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireCapability("audit.view"));

router.get("/", asyncHandler(listHandler));

export default router;
