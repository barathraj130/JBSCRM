import { Router } from "express";
import { drilldownHandler, summaryHandler } from "@/controllers/productivity.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/:employeeId", asyncHandler(summaryHandler));
router.get("/:employeeId/drilldown", asyncHandler(drilldownHandler));

export default router;
