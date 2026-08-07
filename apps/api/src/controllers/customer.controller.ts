import type { Response } from "express";
import { z } from "zod";
import * as customerService from "@/services/customer.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

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
