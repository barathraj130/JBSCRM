import type { Response } from "express";
import { z } from "zod";
import * as reportService from "@/services/report.service";
import * as auditLogService from "@/services/auditLog.service";
import { generateAuditLogCsv, generateEvidenceReportCsv, generateReportCsv, generateReportExcel, generateReportPdf } from "@/lib/reportExport";
import { logActivity } from "@/services/activityLog.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

const filterSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

function parseFilter(req: AuthedRequest) {
  const { from, to } = filterSchema.parse(req.query);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new HttpError(400, "Invalid date range");
  }
  return { from: fromDate, to: toDate };
}

async function recordExport(actorId: string, reportType: string, format: string) {
  await logActivity("report", reportType, actorId, "report_exported", { reportType, format });
}

export async function summaryHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const report = await reportService.getReportSummary(req.user!, filter);
  res.json(report);
}

export async function exportPdfHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const report = await reportService.getReportSummary(req.user!, filter);
  const buffer = await generateReportPdf(report);
  await recordExport(req.user!.id, "sales_summary", "pdf");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="report.pdf"`);
  res.send(buffer);
}

export async function exportExcelHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const report = await reportService.getReportSummary(req.user!, filter);
  const buffer = await generateReportExcel(report);
  await recordExport(req.user!.id, "sales_summary", "xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="report.xlsx"`);
  res.send(buffer);
}

export async function exportCsvHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const report = await reportService.getReportSummary(req.user!, filter);
  const csv = generateReportCsv(report);
  await recordExport(req.user!.id, "sales_summary", "csv");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="report.csv"`);
  res.send(csv);
}

export async function exportEvidenceCsvHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const rows = await reportService.getEvidenceReportRows(req.user!, filter);
  const csv = generateEvidenceReportCsv(rows);
  await recordExport(req.user!.id, "evidence", "csv");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="evidence-report.csv"`);
  res.send(csv);
}

export async function exportAuditLogCsvHandler(req: AuthedRequest, res: Response) {
  const filter = parseFilter(req);
  const { items } = await auditLogService.listAuditLogs(req.user!, { from: filter.from.toISOString(), to: filter.to.toISOString(), pageSize: 5000 });
  const csv = generateAuditLogCsv(items);
  await recordExport(req.user!.id, "audit_log", "csv");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="audit-log.csv"`);
  res.send(csv);
}
