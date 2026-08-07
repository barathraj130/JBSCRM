import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DuplicateCustomerError, HttpError } from "@/middleware/errorHandler";
import { toLeadDTO } from "@/utils/mappers";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { logActivity } from "@/services/activityLog.service";
import { createNotification } from "@/services/notification.service";
import type { BulkUpdateLeadsInput, CreateLeadInput, LeadStatus, UpdateLeadInput } from "@indiamart-crm/shared";

const leadInclude = { customer: true, assignedTo: true } satisfies Prisma.LeadInclude;

export interface ListLeadsFilter {
  q?: string;
  status?: LeadStatus[];
  assignedToId?: string;
  sortBy?: "createdAt" | "status" | "customerName";
  sortDir?: "asc" | "desc";
}

export async function listLeads(actor: RequestingUser, filter: ListLeadsFilter) {
  const visibleUserIds = await getVisibleUserIds(actor);

  const where: Prisma.LeadWhereInput = {};

  if (visibleUserIds) {
    where.assignedToId = filter.assignedToId
      ? visibleUserIds.includes(filter.assignedToId)
        ? filter.assignedToId
        : "__none__"
      : { in: visibleUserIds };
  } else if (filter.assignedToId) {
    where.assignedToId = filter.assignedToId;
  }

  if (filter.status?.length) {
    where.status = { in: filter.status };
  }

  if (filter.q) {
    where.OR = [
      { customer: { name: { contains: filter.q, mode: "insensitive" } } },
      { customer: { phone: { contains: filter.q } } },
      { customer: { company: { contains: filter.q, mode: "insensitive" } } },
      { productInterested: { contains: filter.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    filter.sortBy === "status"
      ? { status: filter.sortDir ?? "asc" }
      : filter.sortBy === "customerName"
        ? { customer: { name: filter.sortDir ?? "asc" } }
        : { createdAt: filter.sortDir ?? "desc" };

  const leads = await prisma.lead.findMany({ where, include: leadInclude, orderBy });
  return leads.map(toLeadDTO);
}

export async function createLead(actor: RequestingUser, input: CreateLeadInput) {
  const existing = await prisma.customer.findUnique({ where: { phone: input.phone } });
  if (existing) {
    throw new DuplicateCustomerError(existing.id);
  }

  const assignedToId = actor.role === "EMPLOYEE" ? actor.id : (input.assignedToId ?? actor.id);

  const customer = await prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      city: input.city,
      state: input.state,
    },
  });

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      productInterested: input.productInterested,
      source: input.source ?? "Manual Entry",
      assignedToId,
    },
    include: leadInclude,
  });

  if (input.notes) {
    await prisma.note.create({ data: { customerId: customer.id, authorId: actor.id, body: input.notes } });
  }

  await logActivity("lead", lead.id, actor.id, "lead_created", { customerId: customer.id });

  if (assignedToId && assignedToId !== actor.id) {
    await createNotification(assignedToId, "NEW_LEAD", `New lead: ${customer.name}`, {
      entityType: "customer",
      entityId: customer.id,
    });
  }

  return toLeadDTO(lead);
}

async function assertLeadAccess(actor: RequestingUser, leadId: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: leadInclude });
  if (!lead) {
    throw new HttpError(404, "Lead not found");
  }
  if (visibleUserIds && (!lead.assignedToId || !visibleUserIds.includes(lead.assignedToId))) {
    throw new HttpError(403, "You do not have access to this lead");
  }
  return lead;
}

export async function updateLead(actor: RequestingUser, leadId: string, input: UpdateLeadInput) {
  const lead = await assertLeadAccess(actor, leadId);

  if (input.assignedToId !== undefined && actor.role === "EMPLOYEE") {
    throw new HttpError(403, "Only managers and admins can reassign leads");
  }

  const data: Prisma.LeadUpdateInput = {};
  if (input.status && input.status !== lead.status) {
    data.status = input.status;
    await logActivity("lead", leadId, actor.id, "status_changed", { from: lead.status, to: input.status });

    if (lead.assignedToId && (input.status === "WON" || input.status === "LOST")) {
      await createNotification(
        lead.assignedToId,
        input.status === "WON" ? "DEAL_WON" : "DEAL_LOST",
        `Deal ${input.status === "WON" ? "won" : "lost"}: ${lead.customer.name}`,
        { entityType: "customer", entityId: lead.customerId }
      );
    }
  }
  if (input.assignedToId !== undefined && input.assignedToId !== lead.assignedToId) {
    data.assignedTo = input.assignedToId ? { connect: { id: input.assignedToId } } : { disconnect: true };
    await logActivity("lead", leadId, actor.id, "reassigned", { from: lead.assignedToId, to: input.assignedToId });

    if (input.assignedToId && input.assignedToId !== actor.id) {
      await createNotification(input.assignedToId, "NEW_LEAD", `Lead assigned to you: ${lead.customer.name}`, {
        entityType: "customer",
        entityId: lead.customerId,
      });
    }
  }
  if (input.dealValue !== undefined) {
    data.dealValue = input.dealValue;
  }
  if (input.productInterested !== undefined) {
    data.productInterested = input.productInterested;
  }

  const updated = await prisma.lead.update({ where: { id: leadId }, data, include: leadInclude });
  return toLeadDTO(updated);
}

export async function bulkUpdateLeads(actor: RequestingUser, input: BulkUpdateLeadsInput) {
  if (input.assignedToId !== undefined && actor.role === "EMPLOYEE") {
    throw new HttpError(403, "Only managers and admins can reassign leads");
  }

  const visibleUserIds = await getVisibleUserIds(actor);
  const leads = await prisma.lead.findMany({ where: { id: { in: input.ids } } });
  const allowed = leads.filter((l) => !visibleUserIds || (l.assignedToId && visibleUserIds.includes(l.assignedToId)));

  const data: Prisma.LeadUncheckedUpdateManyInput = {};
  if (input.status) data.status = input.status;
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;

  if (allowed.length === 0 || Object.keys(data).length === 0) {
    return { updated: 0 };
  }

  await prisma.lead.updateMany({ where: { id: { in: allowed.map((l) => l.id) } }, data });

  await Promise.all(
    allowed.map((l) =>
      logActivity("lead", l.id, actor.id, "bulk_update", { status: input.status, assignedToId: input.assignedToId })
    )
  );

  return { updated: allowed.length };
}
