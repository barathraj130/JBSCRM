import type { Response } from "express";
import { z } from "zod";
import * as customerService from "@/services/customer.service";
import * as callService from "@/services/call.service";
import * as evidenceService from "@/services/evidence.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";
import { CallDirection } from "@indiamart-crm/shared";

const listQuerySchema = z.object({
  q: z.string().optional(),
  assignedToId: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export async function listHandler(req: AuthedRequest, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const customers = await customerService.listCustomers(req.user!, query);
  res.json(customers);
}

export async function getHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const customer = await customerService.getCustomerDetail(req.user!, req.params.id);
  res.json(customer);
}

const lookupSchema = z.object({ phone: z.string().min(1) });

export async function lookupHandler(req: AuthedRequest, res: Response) {
  const { phone } = lookupSchema.parse(req.query);
  const customer = await customerService.findByPhone(phone);
  res.json(customer);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function updateHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const input = updateSchema.parse(req.body);
  const customer = await customerService.updateCustomer(req.user!, req.params.id, { ...input, email: input.email || undefined });
  res.json(customer);
}

const noteSchema = z.object({ body: z.string().min(1) });

export async function addNoteHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const { body } = noteSchema.parse(req.body);
  const note = await customerService.addNote(req.user!, req.params.id, body);
  res.status(201).json(note);
}

export async function editNoteHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id || !req.params.noteId) throw new HttpError(400, "Missing customer or note id");
  const { body } = noteSchema.parse(req.body);
  const note = await customerService.editNote(req.user!, req.params.id, req.params.noteId, body);
  res.status(201).json(note);
}

export async function timelineHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const timeline = await evidenceService.getCustomerTimeline(req.user!, req.params.id);
  res.json(timeline);
}

const callSchema = z.object({
  direction: z.enum([CallDirection.INCOMING, CallDirection.OUTGOING]),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  status: z.string().min(1),
  outcome: z.string().optional(),
});

export async function logCallHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const input = callSchema.parse(req.body);
  const call = await callService.logCall(req.user!, { ...input, customerId: req.params.id });
  res.status(201).json(call);
}

export async function listCallsHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing customer id");
  const calls = await callService.listCallsForCustomer(req.user!, req.params.id);
  res.json(calls);
}
