import type { Response } from "express";
import { z } from "zod";
import * as leadService from "@/services/lead.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";
import { LeadStatus, type BulkUpdateLeadsInput, type UpdateLeadInput } from "@indiamart-crm/shared";

const leadStatusValues = Object.values(LeadStatus) as [LeadStatus, ...LeadStatus[]];

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",") : undefined)),
  assignedToId: z.string().optional(),
  sortBy: z.enum(["createdAt", "status", "customerName"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export async function listHandler(req: AuthedRequest, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const leads = await leadService.listLeads(req.user!, {
    ...query,
    status: query.status as leadService.ListLeadsFilter["status"],
  });
  res.json(leads);
}

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  productInterested: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function createHandler(req: AuthedRequest, res: Response) {
  const input = createSchema.parse(req.body);
  const lead = await leadService.createLead(req.user!, { ...input, email: input.email || undefined });
  res.status(201).json(lead);
}

const updateSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedToId: z.string().nullable().optional(),
  dealValue: z.number().nullable().optional(),
  productInterested: z.string().optional(),
});

export async function updateHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing lead id");
  const input: UpdateLeadInput = updateSchema.parse(req.body);
  const lead = await leadService.updateLead(req.user!, req.params.id, input);
  res.json(lead);
}

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(leadStatusValues).optional(),
  assignedToId: z.string().optional(),
});

export async function bulkUpdateHandler(req: AuthedRequest, res: Response) {
  const input: BulkUpdateLeadsInput = bulkSchema.parse(req.body);
  const result = await leadService.bulkUpdateLeads(req.user!, input);
  res.json(result);
}

export async function assignmentHistoryHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing lead id");
  const history = await leadService.getAssignmentHistory(req.user!, req.params.id);
  res.json(history);
}

export async function uncontactedAlertsHandler(req: AuthedRequest, res: Response) {
  const alerts = await leadService.getUncontactedLeadAlerts(req.user!);
  res.json(alerts);
}
