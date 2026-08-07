import { Router } from "express";
import { automationStatusHandler, createEmployeeHandler, listEmployeesHandler, systemLogsHandler, updateEmployeeHandler } from "@/controllers/admin.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/employees", asyncHandler(listEmployeesHandler));
router.post("/employees", asyncHandler(createEmployeeHandler));
router.patch("/employees/:id", asyncHandler(updateEmployeeHandler));

router.get("/system-logs", asyncHandler(systemLogsHandler));
router.get("/automation-status", asyncHandler(automationStatusHandler));

export default router;
