import type { Request, Response } from "express";
import * as dashboardService from "@/services/dashboard.service";

export async function summaryHandler(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary();
  res.json(summary);
}
