import type { Response } from "express";
import { z } from "zod";
import * as evidenceService from "@/services/evidence.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

const rangeSchema = z.object({ range: z.enum(["daily", "weekly", "monthly"]).default("daily") });

export async function summaryHandler(req: AuthedRequest, res: Response) {
  if (!req.params.employeeId) throw new HttpError(400, "Missing employee id");
  const { range } = rangeSchema.parse(req.query);
  const summary = await evidenceService.getProductivitySummary(req.user!, req.params.employeeId, range);
  res.json(summary);
}

const drilldownSchema = z.object({
  range: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  metric: z.string().min(1),
});

export async function drilldownHandler(req: AuthedRequest, res: Response) {
  if (!req.params.employeeId) throw new HttpError(400, "Missing employee id");
  const { range, metric } = drilldownSchema.parse(req.query);
  const rows = await evidenceService.getProductivityDrilldown(
    req.user!,
    req.params.employeeId,
    metric as Parameters<typeof evidenceService.getProductivityDrilldown>[2],
    range
  );
  res.json(rows);
}
