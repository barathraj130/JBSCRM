import { Router } from "express";
import {
  assignmentHistoryHandler,
  bulkUpdateHandler,
  createHandler,
  listHandler,
  uncontactedAlertsHandler,
  updateHandler,
} from "@/controllers/lead.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHandler));
router.get("/uncontacted-alerts", asyncHandler(uncontactedAlertsHandler));
router.post("/", asyncHandler(createHandler));
router.patch("/bulk", asyncHandler(bulkUpdateHandler));
router.patch("/:id", asyncHandler(updateHandler));
router.get("/:id/assignment-history", asyncHandler(assignmentHistoryHandler));

export default router;
