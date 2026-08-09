import type { Request, Response } from "express";
import * as systemService from "@/services/system.service";

export async function checkUncontactedLeadsHandler(req: Request, res: Response) {
  systemService.verifySystemApiKey(req.headers["x-n8n-api-key"] as string | undefined);
  const result = await systemService.checkUncontactedLeads();
  res.json(result);
}
