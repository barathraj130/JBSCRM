import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toActivityLogDTO, toCustomerRef, toFollowUpDTO, toLeadDTO, toNoteDTO, toWhatsAppMessageDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { recordEvidence } from "@/services/evidence.service";
import type { CustomerDetailDTO, UpdateCustomerInput } from "@indiamart-crm/shared";

export async function assertCustomerAccess(actor: RequestingUser, customerId: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { leads: true },
  });
  if (!customer) {
    throw new HttpError(404, "Customer not found");
  }
  if (visibleUserIds && !customer.leads.some((l) => l.assignedToId && visibleUserIds.includes(l.assignedToId))) {
    throw new HttpError(403, "You do not have access to this customer");
  }
  return customer;
}

export async function getCustomerDetail(actor: RequestingUser, customerId: string): Promise<CustomerDetailDTO> {
  const customer = await assertCustomerAccess(actor, customerId);

  const leadIds = customer.leads.map((l) => l.id);

  const [leads, notes, followUps, activityLogs, whatsAppMessages] = await Promise.all([
    prisma.lead.findMany({ where: { customerId }, include: { customer: true, assignedTo: true }, orderBy: { createdAt: "desc" } }),
    prisma.note.findMany({ where: { customerId, supersededBy: null }, include: { author: true }, orderBy: { createdAt: "desc" } }),
    prisma.followUp.findMany({
      where: { lead: { customerId } },
      include: { user: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.activityLog.findMany({
      where: { OR: [{ entityType: "customer", entityId: customerId }, { entityType: "lead", entityId: { in: leadIds } }] },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.whatsAppMessage.findMany({ where: { customerId }, include: { sentBy: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    company: customer.company,
    city: customer.city,
    state: customer.state,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    leads: leads.map(toLeadDTO),
    notes: notes.map(toNoteDTO),
    followUps: followUps.map(toFollowUpDTO),
    activityLogs: activityLogs.map(toActivityLogDTO),
    whatsAppMessages: whatsAppMessages.map(toWhatsAppMessageDTO),
  };
}

export async function findByPhone(phone: string) {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  return customer ? toCustomerRef(customer) : null;
}

export async function updateCustomer(actor: RequestingUser, customerId: string, input: UpdateCustomerInput) {
  await assertCustomerAccess(actor, customerId);
  const customer = await prisma.customer.update({ where: { id: customerId }, data: input });
  await logActivity("customer", customerId, actor.id, "profile_updated", input);
  return toCustomerRef(customer);
}

export async function addNote(actor: RequestingUser, customerId: string, body: string) {
  await assertCustomerAccess(actor, customerId);
  const note = await prisma.note.create({
    data: { customerId, authorId: actor.id, body },
    include: { author: true },
  });
  await logActivity("customer", customerId, actor.id, "note_added");
  await recordEvidence({
    customerId,
    employeeId: actor.id,
    type: "NOTE_ADDED",
    status: "VERIFIED",
    refType: "Note",
    refId: note.id,
  });
  return toNoteDTO(note);
}

/**
 * Notes are never silently edited in place. Editing creates a new Note pointing at the
 * previous version and marks the old one superseded, so the full history stays intact.
 */
export async function editNote(actor: RequestingUser, customerId: string, noteId: string, body: string) {
  await assertCustomerAccess(actor, customerId);
  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing || existing.customerId !== customerId) throw new HttpError(404, "Note not found");

  const newNote = await prisma.note.create({
    data: { customerId, authorId: actor.id, body, previousVersionId: existing.id },
    include: { author: true },
  });

  await logActivity("customer", customerId, actor.id, "note_edited", { noteId: existing.id, newNoteId: newNote.id }, { oldValue: existing.body, newValue: body });

  return toNoteDTO(newNote);
}
