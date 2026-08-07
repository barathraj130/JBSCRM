import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { env } from "@/lib/env";
import type { ReportSummaryDTO } from "@indiamart-crm/shared";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN");
}

export function generateReportPdf(report: ReportSummaryDTO): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text(`${env.companyName} — Sales Report`);
    doc.fontSize(10).font("Helvetica").fillColor("#555").text(`${fmtDate(report.from)} – ${fmtDate(report.to)}`);
    doc.moveDown(1.2);

    doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text("Summary");
    doc.font("Helvetica").fontSize(10).fillColor("#333");
    doc.text(`Total leads: ${report.totalLeads}`);
    doc.text(`Won: ${report.wonDeals}   Lost: ${report.lostDeals}   Conversion rate: ${report.conversionRate}%`);
    doc.text(`Revenue: Rs. ${report.revenue.toLocaleString("en-IN")}`);
    doc.moveDown(1);

    doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text("By employee");
    doc.moveDown(0.3);
    let y = doc.y;
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Name", 50, y);
    doc.text("Leads", 220, y);
    doc.text("Won", 280, y);
    doc.text("Lost", 330, y);
    doc.text("Conv.", 380, y);
    doc.text("Revenue", 440, y);
    y += 14;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ccc").stroke();
    y += 6;
    doc.font("Helvetica").fontSize(9).fillColor("#333");
    for (const row of report.byEmployee) {
      doc.text(row.name, 50, y, { width: 160 });
      doc.text(String(row.leadsAssigned), 220, y);
      doc.text(String(row.leadsWon), 280, y);
      doc.text(String(row.leadsLost), 330, y);
      doc.text(`${row.conversionRate}%`, 380, y);
      doc.text(`Rs. ${row.revenue.toLocaleString("en-IN")}`, 440, y);
      y += 16;
    }
    if (report.byEmployee.length === 0) {
      doc.text("No data for this period.", 50, y);
      y += 16;
    }

    doc.moveDown(1.5);
    doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text("By lead source");
    doc.font("Helvetica").fontSize(9).fillColor("#333");
    for (const row of report.bySource) doc.text(`${row.label}: ${row.count}`);

    doc.moveDown(1);
    doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text("By status");
    doc.font("Helvetica").fontSize(9).fillColor("#333");
    for (const row of report.byStatus) doc.text(`${row.label}: ${row.count}`);

    doc.end();
  });
}

export async function generateReportExcel(report: ReportSummaryDTO): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = env.companyName;

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Value", key: "value", width: 20 },
  ];
  summary.addRows([
    { metric: "Period", value: `${fmtDate(report.from)} - ${fmtDate(report.to)}` },
    { metric: "Total leads", value: report.totalLeads },
    { metric: "Won", value: report.wonDeals },
    { metric: "Lost", value: report.lostDeals },
    { metric: "Conversion rate (%)", value: report.conversionRate },
    { metric: "Revenue (Rs.)", value: report.revenue },
  ]);
  summary.getRow(1).font = { bold: true };

  const byEmployee = workbook.addWorksheet("By Employee");
  byEmployee.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Leads Assigned", key: "leadsAssigned", width: 16 },
    { header: "Won", key: "leadsWon", width: 10 },
    { header: "Lost", key: "leadsLost", width: 10 },
    { header: "Conversion Rate (%)", key: "conversionRate", width: 18 },
    { header: "Revenue (Rs.)", key: "revenue", width: 16 },
    { header: "Follow-ups Completed", key: "followUpsCompleted", width: 20 },
  ];
  byEmployee.addRows(report.byEmployee);
  byEmployee.getRow(1).font = { bold: true };

  const bySource = workbook.addWorksheet("By Source");
  bySource.columns = [
    { header: "Source", key: "label", width: 24 },
    { header: "Count", key: "count", width: 12 },
  ];
  bySource.addRows(report.bySource);
  bySource.getRow(1).font = { bold: true };

  const byStatus = workbook.addWorksheet("By Status");
  byStatus.columns = [
    { header: "Status", key: "label", width: 24 },
    { header: "Count", key: "count", width: 12 },
  ];
  byStatus.addRows(report.byStatus);
  byStatus.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function generateReportCsv(report: ReportSummaryDTO): string {
  const lines: string[] = [];
  lines.push(`Report period,${fmtDate(report.from)} - ${fmtDate(report.to)}`);
  lines.push(`Total leads,${report.totalLeads}`);
  lines.push(`Won,${report.wonDeals}`);
  lines.push(`Lost,${report.lostDeals}`);
  lines.push(`Conversion rate (%),${report.conversionRate}`);
  lines.push(`Revenue (Rs.),${report.revenue}`);
  lines.push("");
  lines.push("By Employee");
  lines.push("Name,Leads Assigned,Won,Lost,Conversion Rate (%),Revenue (Rs.),Follow-ups Completed");
  for (const row of report.byEmployee) {
    lines.push(
      [row.name, row.leadsAssigned, row.leadsWon, row.leadsLost, row.conversionRate, row.revenue, row.followUpsCompleted]
        .map(csvEscape)
        .join(",")
    );
  }
  lines.push("");
  lines.push("By Source");
  lines.push("Source,Count");
  for (const row of report.bySource) lines.push([row.label, row.count].map(csvEscape).join(","));
  lines.push("");
  lines.push("By Status");
  lines.push("Status,Count");
  for (const row of report.byStatus) lines.push([row.label, row.count].map(csvEscape).join(","));
  return lines.join("\n");
}
