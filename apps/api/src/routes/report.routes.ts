import { Router } from "express";
import { exportCsvHandler, exportExcelHandler, exportPdfHandler, summaryHandler } from "@/controllers/report.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "SALES_MANAGER"));

router.get("/summary", asyncHandler(summaryHandler));
router.get("/export.pdf", asyncHandler(exportPdfHandler));
router.get("/export.xlsx", asyncHandler(exportExcelHandler));
router.get("/export.csv", asyncHandler(exportCsvHandler));

export default router;
