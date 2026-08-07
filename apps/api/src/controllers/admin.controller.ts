import type { Request, Response } from "express";
import { z } from "zod";
import * as adminService from "@/services/admin.service";
import { Role } from "@indiamart-crm/shared";
import { HttpError } from "@/middleware/errorHandler";

const roleValues = Object.values(Role) as [Role, ...Role[]];

export async function listEmployeesHandler(_req: Request, res: Response) {
  res.json(await adminService.listEmployees());
}

const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(roleValues),
  managerId: z.string().optional(),
});

export async function createEmployeeHandler(req: Request, res: Response) {
  const input = createEmployeeSchema.parse(req.body);
  res.status(201).json(await adminService.createEmployee(input));
}

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(roleValues).optional(),
  managerId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function updateEmployeeHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing employee id");
  const input = updateEmployeeSchema.parse(req.body);
  res.json(await adminService.updateEmployee(req.params.id, input));
}

export async function listTemplatesHandler(_req: Request, res: Response) {
  res.json(await adminService.listWhatsAppTemplates());
}

const templateSchema = z.object({ name: z.string().min(1), body: z.string().min(1) });

export async function createTemplateHandler(req: Request, res: Response) {
  const input = templateSchema.parse(req.body);
  res.status(201).json(await adminService.createWhatsAppTemplate(input));
}

export async function updateTemplateHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing template id");
  const input = templateSchema.partial().parse(req.body);
  res.json(await adminService.updateWhatsAppTemplate(req.params.id, input));
}

export async function deleteTemplateHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing template id");
  await adminService.deleteWhatsAppTemplate(req.params.id);
  res.status(204).send();
}

export async function systemLogsHandler(_req: Request, res: Response) {
  res.json(await adminService.listSystemLogs());
}

export async function automationStatusHandler(_req: Request, res: Response) {
  res.json(adminService.getAutomationStatus());
}
