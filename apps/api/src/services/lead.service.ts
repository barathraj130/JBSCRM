import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DuplicateCustomerError, EvidenceRequiredError, HttpError } from "@/middleware/errorHandler";
import { toLeadDTO, toLeadAssignmentHistoryDTO } from "@/utils/mappers";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { logActivity } from "@/services/activityLog.service";
import { createNotification } from "@/services/notification.service";
import { hasAnyContactEvidence, recordContactProof, recordEvidence } from "@/services/evidence.service";
import { env } from "@/lib/env";
import type { BulkUpdateLeadsInput, CreateLeadInput, LeadStatus, UpdateLeadInput, UncontactedLeadAlertDTO } from "@indiamart-crm/shared";

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
    await prisma.customerDuplicateAttempt.create({
      data: { phone: input.phone, attemptedById: actor.id, existingCustomerId: existing.id },
    });
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
    await recordEvidence({
      customerId: customer.id,
      leadId: lead.id,
      employeeId: actor.id,
      type: "NOTE_ADDED",
      status: "VERIFIED",
      refType: "Note",
    });
  }

  await recordEvidence({
    customerId: customer.id,
    leadId: lead.id,
    employeeId: actor.id,
    type: "CUSTOMER_CREATED",
    status: "VERIFIED",
    refType: "Customer",
    refId: customer.id,
  });

  if (assignedToId) {
    await prisma.leadAssignmentHistory.create({
      data: { leadId: lead.id, fromUserId: null, toUserId: assignedToId, changedById: actor.id },
    });
    await recordEvidence({
      customerId: customer.id,
      leadId: lead.id,
      employeeId: assignedToId,
      type: "LEAD_ASSIGNED",
      status: "VERIFIED",
      refType: "Lead",
      refId: lead.id,
    });
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

/**
 * "Quotation Sent" is a claim, not just a label — the status is only allowed to move
 * there once a real quotation has actually been sent for this lead (a QUOTATION_SENT
 * Evidence row exists). Otherwise an employee could mark it without ever generating one.
 */
async function assertQuotationSentEvidence(leadId: string) {
  const evidence = await prisma.evidence.findFirst({ where: { leadId, type: "QUOTATION_SENT" } });
  if (!evidence) {
    throw new HttpError(
      400,
      "Cannot mark as Quotation Sent — no quotation has actually been sent for this lead yet. Send one from the Quotations tab first."
    );
  }
}

/**
 * "Contacted" can legitimately happen outside the app's own tracked channels (a personal
 * WhatsApp message, an SMS) — unlike Quotation Sent there's no single verifiable action to
 * require. So this accepts either real in-app evidence, or a screenshot the employee attaches
 * as self-reported proof. With neither, the status change is rejected with EVIDENCE_REQUIRED
 * so the frontend can prompt for an upload instead of just failing.
 */
async function assertContactedEvidence(leadId: string, customerId: string, employeeId: string, evidenceImageUrl?: string) {
  if (await hasAnyContactEvidence(leadId)) return;
  if (!evidenceImageUrl) {
    throw new EvidenceRequiredError("Please upload a screenshot as evidence that you contacted this customer.");
  }
  await recordContactProof({ customerId, leadId, employeeId, imageUrl: evidenceImageUrl });
  await logActivity("customer", customerId, employeeId, "contact_proof_uploaded", { leadId, imageUrl: evidenceImageUrl });
}

export async function updateLead(actor: RequestingUser, leadId: string, input: UpdateLeadInput) {
  const lead = await assertLeadAccess(actor, leadId);

  if (input.assignedToId !== undefined && actor.role === "EMPLOYEE") {
    throw new HttpError(403, "Only managers and admins can reassign leads");
  }

  if (input.status === "QUOTATION_SENT") {
    await assertQuotationSentEvidence(leadId);
  }

  if (input.status === "CONTACTED") {
    await assertContactedEvidence(leadId, lead.customerId, actor.id, input.evidenceImageUrl);
  }

  const data: Prisma.LeadUpdateInput = {};
  if (input.status && input.status !== lead.status) {
    data.status = input.status;
    await logActivity("lead", leadId, actor.id, "status_changed", { from: lead.status, to: input.status });
    await recordEvidence({
      customerId: lead.customerId,
      leadId,
      employeeId: actor.id,
      type: "LEAD_STATUS_CHANGED",
      status: "VERIFIED",
      refType: "Lead",
      refId: leadId,
      metadata: { from: lead.status, to: input.status },
    });

    if (input.status === "WON") {
      await recordEvidence({
        customerId: lead.customerId,
        leadId,
        employeeId: lead.assignedToId ?? actor.id,
        type: "DEAL_WON",
        status: "VERIFIED",
        refType: "Lead",
        refId: leadId,
        metadata: { dealValue: lead.dealValue ? Number(lead.dealValue) : null },
      });
    }

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

    await prisma.leadAssignmentHistory.create({
      data: { leadId, fromUserId: lead.assignedToId, toUserId: input.assignedToId ?? null, changedById: actor.id },
    });

    if (input.assignedToId) {
      await recordEvidence({
        customerId: lead.customerId,
        leadId,
        employeeId: input.assignedToId,
        type: "LEAD_REASSIGNED",
        status: "VERIFIED",
        refType: "Lead",
        refId: leadId,
        metadata: { from: lead.assignedToId, to: input.assignedToId },
      });
    }

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
  let allowed = leads.filter((l) => !visibleUserIds || (l.assignedToId && visibleUserIds.includes(l.assignedToId)));

  if (input.status === "QUOTATION_SENT") {
    const withEvidence = new Set(
      (await prisma.evidence.findMany({ where: { leadId: { in: allowed.map((l) => l.id) }, type: "QUOTATION_SENT" }, select: { leadId: true } })).map(
        (e) => e.leadId
      )
    );
    // No exception for leads already sitting at this status — evidence is required every
    // time it's applied, otherwise a status set before this rule existed (or reapplied via
    // bulk) could keep passing through without ever having a real quotation behind it.
    allowed = allowed.filter((l) => withEvidence.has(l.id));
  }

  if (input.status === "CONTACTED") {
    // Bulk mode can't attach a new screenshot per lead, so only leads that already have
    // verified evidence or a previously-uploaded proof pass through; the rest are skipped —
    // mark them one at a time from the lead's own page to attach a screenshot.
    const withEvidence = (
      await Promise.all(allowed.map(async (l) => ((await hasAnyContactEvidence(l.id)) ? l.id : null)))
    ).filter((id): id is string => id !== null);
    const evidencedSet = new Set(withEvidence);
    allowed = allowed.filter((l) => evidencedSet.has(l.id));
  }

  const data: Prisma.LeadUncheckedUpdateManyInput = {};
  if (input.status) data.status = input.status;
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;

  if (allowed.length === 0 || Object.keys(data).length === 0) {
    return { updated: 0 };
  }

  await prisma.lead.updateMany({ where: { id: { in: allowed.map((l) => l.id) } }, data });

  await Promise.all(
    allowed.map(async (l) => {
      await logActivity("lead", l.id, actor.id, "bulk_update", { status: input.status, assignedToId: input.assignedToId });
      if (input.assignedToId !== undefined && input.assignedToId !== l.assignedToId) {
        await prisma.leadAssignmentHistory.create({
          data: { leadId: l.id, fromUserId: l.assignedToId, toUserId: input.assignedToId ?? null, changedById: actor.id },
        });
      }
    })
  );

  return { updated: allowed.length };
}

export async function getAssignmentHistory(actor: RequestingUser, leadId: string) {
  await assertLeadAccess(actor, leadId);
  const rows = await prisma.leadAssignmentHistory.findMany({
    where: { leadId },
    include: { fromUser: true, toUser: true, changedBy: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toLeadAssignmentHistoryDTO);
}

export async function getUncontactedLeadAlerts(actor: RequestingUser): Promise<UncontactedLeadAlertDTO[]> {
  const visibleUserIds = await getVisibleUserIds(actor);
  const thresholdMs = env.uncontactedLeadAlertMinutes * 60 * 1000;
  const cutoff = new Date(Date.now() - thresholdMs);

  const where: Prisma.LeadWhereInput = {
    status: "NEW",
    createdAt: { lte: cutoff },
  };
  if (visibleUserIds) where.assignedToId = { in: visibleUserIds };

  const candidates = await prisma.lead.findMany({ where, include: leadInclude, orderBy: { createdAt: "asc" } });
  if (candidates.length === 0) return [];

  const contactedLeadIds = new Set(
    (
      await prisma.evidence.findMany({
        where: { leadId: { in: candidates.map((l) => l.id) }, status: "VERIFIED" },
        select: { leadId: true },
      })
    )
      .map((e) => e.leadId)
      .filter((id): id is string => id !== null)
  );

  const now = Date.now();
  return candidates
    .filter((l) => !contactedLeadIds.has(l.id))
    .map((l) => ({
      lead: toLeadDTO(l),
      minutesSinceCreated: Math.round((now - l.createdAt.getTime()) / 60000),
    }));
}
