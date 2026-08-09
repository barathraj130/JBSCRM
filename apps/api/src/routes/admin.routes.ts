import { Router } from "express";
import {
  automationStatusHandler,
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeePermissionsHandler,
  listDuplicateAttemptsHandler,
  listEmployeesHandler,
  listScoreConfigHandler,
  systemLogsHandler,
  updateEmployeeHandler,
  updateEmployeePermissionsHandler,
  updateScoreConfigHandler,
} from "@/controllers/admin.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/employees", asyncHandler(listEmployeesHandler));
router.post("/employees", asyncHandler(createEmployeeHandler));
router.patch("/employees/:id", asyncHandler(updateEmployeeHandler));
router.delete("/employees/:id", asyncHandler(deleteEmployeeHandler));

router.get("/employees/:id/permissions", asyncHandler(getEmployeePermissionsHandler));
router.patch("/employees/:id/permissions", asyncHandler(updateEmployeePermissionsHandler));

router.get("/system-logs", asyncHandler(systemLogsHandler));
router.get("/automation-status", asyncHandler(automationStatusHandler));

router.get("/score-config", asyncHandler(listScoreConfigHandler));
router.patch("/score-config", asyncHandler(updateScoreConfigHandler));

router.get("/duplicate-attempts", asyncHandler(listDuplicateAttemptsHandler));

export default router;
