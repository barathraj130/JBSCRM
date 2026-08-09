import { Router } from "express";
import {
  exportAuditLogCsvHandler,
  exportCsvHandler,
  exportEvidenceCsvHandler,
  exportExcelHandler,
  exportPdfHandler,
  summaryHandler,
} from "@/controllers/report.controller";
import { requireAuth, requireCapability } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireCapability("reports.export"));

router.get("/summary", asyncHandler(summaryHandler));
router.get("/export.pdf", asyncHandler(exportPdfHandler));
router.get("/export.xlsx", asyncHandler(exportExcelHandler));
router.get("/export.csv", asyncHandler(exportCsvHandler));
router.get("/evidence.csv", asyncHandler(exportEvidenceCsvHandler));
router.get("/audit-log.csv", asyncHandler(exportAuditLogCsvHandler));

export default router;
