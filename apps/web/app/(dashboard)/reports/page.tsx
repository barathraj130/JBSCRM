"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAD_STATUS_LABELS } from "@indiamart-crm/shared";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { ReportSummaryDTO } from "@indiamart-crm/shared";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [from, setFrom] = React.useState(isoDate(firstOfMonth()));
  const [to, setTo] = React.useState(isoDate(new Date()));
  const [report, setReport] = React.useState<ReportSummaryDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReport = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReportSummary(token, from, to);
      setReport(data);
    } catch {
      setError("Could not load report.");
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  React.useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleExport(kind: "pdf" | "xlsx" | "csv") {
    if (!token) return;
    setExporting(kind);
    try {
      const blob =
        kind === "pdf"
          ? await api.exportReportPdf(token, from, to)
          : kind === "xlsx"
            ? await api.exportReportExcel(token, from, to)
            : await api.exportReportCsv(token, from, to);
      downloadBlob(blob, `report-${from}-to-${to}.${kind}`);
    } catch {
      setError("Export failed.");
    } finally {
      setExporting(null);
    }
  }

  async function handleEvidenceExport(kind: "evidence" | "audit") {
    if (!token) return;
    setExporting(kind);
    try {
      const blob = kind === "evidence" ? await api.exportEvidenceReportCsv(token, from, to) : await api.exportAuditLogCsv(token, from, to);
      downloadBlob(blob, `${kind}-${from}-to-${to}.csv`);
    } catch {
      setError("Export failed.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales performance and team productivity</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">
              From
            </Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">
              To
            </Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={exporting !== null}>
            {exporting === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} disabled={exporting !== null}>
            {exporting === "xlsx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={exporting !== null}>
            {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEvidenceExport("evidence")} disabled={exporting !== null}>
            {exporting === "evidence" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Evidence
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEvidenceExport("audit")} disabled={exporting !== null}>
            {exporting === "audit" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Audit Log
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading || !report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Total Leads", value: report.totalLeads },
              { label: "Won", value: report.wonDeals },
              { label: "Lost", value: report.lostDeals },
              { label: "Conversion Rate", value: `${report.conversionRate}%` },
              { label: "Revenue", value: `₹${report.revenue.toLocaleString("en-IN")}` },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-foreground">
                <Trophy className="h-4 w-4" />
                Employee leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {report.byEmployee.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No data for this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Won</TableHead>
                      <TableHead>Lost</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Follow-ups done</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byEmployee.map((row, i) => (
                      <TableRow key={row.userId}>
                        <TableCell className="font-medium">
                          {i === 0 && "🏆 "}
                          {row.name}
                        </TableCell>
                        <TableCell>{row.leadsAssigned}</TableCell>
                        <TableCell>{row.leadsWon}</TableCell>
                        <TableCell>{row.leadsLost}</TableCell>
                        <TableCell>{row.conversionRate}%</TableCell>
                        <TableCell>{row.followUpsCompleted}</TableCell>
                        <TableCell>₹{row.revenue.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">By lead source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {report.bySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  report.bySource.map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">By status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {report.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  report.byStatus.map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{LEAD_STATUS_LABELS[row.label as keyof typeof LEAD_STATUS_LABELS] ?? row.label}</span>
                      <span className="font-medium">{row.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
