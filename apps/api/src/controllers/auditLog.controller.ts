import type { Response } from "express";
import { z } from "zod";
import * as auditLogService from "@/services/auditLog.service";
import type { AuthedRequest } from "@/middleware/auth";

const querySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  objectType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export async function listHandler(req: AuthedRequest, res: Response) {
  const filter = querySchema.parse(req.query);
  res.json(await auditLogService.listAuditLogs(req.user!, filter));
}
