import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toCustomerRef, toEvidenceDTO, toUserRef } from "@/utils/mappers";
import type {
  CustomerTimelineEntryDTO,
  EvidenceStatus,
  EvidenceType,
  ProductivityDrilldownRowDTO,
  ProductivityMetricKey,
  ProductivityMetricsDTO,
  ProductivityRange,
  ProductivitySummaryDTO,
} from "@indiamart-crm/shared";
import { EVIDENCE_TYPE_LABELS } from "@indiamart-crm/shared";

export interface RecordEvidenceInput {
  customerId: string;
  leadId?: string | null;
  employeeId?: string | null;
  type: EvidenceType;
  status: EvidenceStatus;
  refType: string;
  refId?: string | null;
  occurredAt?: Date;
  metadata?: unknown;
}

export function recordEvidence(input: RecordEvidenceInput) {
  return prisma.evidence.create({
    data: {
      customerId: input.customerId,
      leadId: input.leadId ?? null,
      employeeId: input.employeeId ?? null,
      type: input.type,
      status: input.status,
      refType: input.refType,
      refId: input.refId ?? null,
      occurredAt: input.occurredAt ?? new Date(),
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

function getRangeBounds(range: ProductivityRange): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  if (range === "daily") {
    from.setHours(0, 0, 0, 0);
  } else if (range === "weekly") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

async function assertEmployeeVisible(actor: RequestingUser, employeeId: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  if (visibleUserIds && !visibleUserIds.includes(employeeId)) {
    throw new HttpError(403, "You do not have access to this employee's data");
  }
}

const ACTIONS_COVERED_BY_EVIDENCE = new Set([
  "lead_created",
  "status_changed",
  "reassigned",
  "whatsapp_message_sent",
  "whatsapp_message_received",
  "whatsapp_auto_catalog_sent",
  "whatsapp_auto_reply_fallback",
  "quotation_created",
  "quotation_sent_whatsapp",
  "follow_up_scheduled",
  "follow_up_completed",
  "note_added",
  "note_edited",
  "call_logged_self_reported",
  "lead_imported_indiamart",
]);

export async function getCustomerTimeline(actor: RequestingUser, customerId: string): Promise<CustomerTimelineEntryDTO[]> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { leads: { select: { id: true, assignedToId: true } } },
  });
  if (!customer) throw new HttpError(404, "Customer not found");

  const visibleUserIds = await getVisibleUserIds(actor);
  if (visibleUserIds && !customer.leads.some((l) => l.assignedToId && visibleUserIds.includes(l.assignedToId))) {
    throw new HttpError(403, "You do not have access to this customer");
  }

  const leadIds = customer.leads.map((l) => l.id);

  const [evidenceRows, activityRows] = await Promise.all([
    prisma.evidence.findMany({ where: { customerId }, include: { employee: true }, orderBy: { occurredAt: "asc" } }),
    prisma.activityLog.findMany({
      where: { OR: [{ entityType: "customer", entityId: customerId }, { entityType: "lead", entityId: { in: leadIds } }] },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const evidenceEntries: CustomerTimelineEntryDTO[] = evidenceRows.map((e) => ({
    id: e.id,
    kind: "evidence",
    type: e.type,
    status: e.status,
    label: EVIDENCE_TYPE_LABELS[e.type],
    occurredAt: e.occurredAt.toISOString(),
    user: toUserRef(e.employee),
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
  }));

  const activityEntries: CustomerTimelineEntryDTO[] = activityRows
    .filter((a) => !ACTIONS_COVERED_BY_EVIDENCE.has(a.action))
    .map((a) => ({
      id: a.id,
      kind: "activity",
      type: a.action,
      status: null,
      label: a.action.replace(/_/g, " "),
      occurredAt: a.createdAt.toISOString(),
      user: toUserRef(a.user),
      metadata: (a.metadata as Record<string, unknown> | null) ?? null,
    }));

  return [...evidenceEntries, ...activityEntries].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

const SCORED_EVIDENCE_TYPES: EvidenceType[] = [
  "WHATSAPP_MESSAGE_SENT",
  "CATALOG_SENT",
  "CALL_LOGGED",
  "FOLLOW_UP_COMPLETED",
  "QUOTATION_SENT",
  "DEAL_WON",
];

async function computeScore(employeeId: string, from: Date, to: Date): Promise<number> {
  const [configs, counts] = await Promise.all([
    prisma.productivityScoreConfig.findMany({ where: { key: { in: SCORED_EVIDENCE_TYPES } } }),
    prisma.evidence.groupBy({
      by: ["type"],
      where: { employeeId, occurredAt: { gte: from, lte: to }, status: "VERIFIED", type: { in: SCORED_EVIDENCE_TYPES } },
      _count: { _all: true },
    }),
  ]);
  const pointsByType = new Map(configs.map((c) => [c.key, c.points]));
  return counts.reduce((sum, row) => sum + row._count._all * (pointsByType.get(row.type) ?? 0), 0);
}

export async function getProductivitySummary(
  actor: RequestingUser,
  employeeId: string,
  range: ProductivityRange
): Promise<ProductivitySummaryDTO> {
  await assertEmployeeVisible(actor, employeeId);
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new HttpError(404, "Employee not found");

  const { from, to } = getRangeBounds(range);
  const evidenceWhere = { employeeId, occurredAt: { gte: from, lte: to } } as const;

  const [
    leadsAssigned,
    verifiedContactCustomerIds,
    whatsappConversations,
    catalogsSent,
    verifiedCalls,
    selfReportedCalls,
    followUpsCompleted,
    followUpsScheduled,
    quotationsCreated,
    quotationsSent,
    dealsWon,
    revenueAgg,
    score,
  ] = await Promise.all([
    prisma.leadAssignmentHistory.count({ where: { toUserId: employeeId, createdAt: { gte: from, lte: to } } }),
    prisma.evidence.findMany({ where: { ...evidenceWhere, status: "VERIFIED" }, select: { customerId: true }, distinct: ["customerId"] }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "WHATSAPP_MESSAGE_SENT", status: "VERIFIED" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "CATALOG_SENT", status: "VERIFIED" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "CALL_LOGGED", status: "VERIFIED" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "CALL_LOGGED", status: "SELF_REPORTED" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "FOLLOW_UP_COMPLETED" } }),
    prisma.followUp.count({ where: { userId: employeeId, createdAt: { gte: from, lte: to } } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "QUOTATION_CREATED" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "QUOTATION_SENT" } }),
    prisma.evidence.count({ where: { ...evidenceWhere, type: "DEAL_WON" } }),
    prisma.lead.aggregate({
      where: { assignedToId: employeeId, status: "WON", updatedAt: { gte: from, lte: to } },
      _sum: { dealValue: true },
    }),
    computeScore(employeeId, from, to),
  ]);

  const revenue = revenueAgg._sum.dealValue ? Number(revenueAgg._sum.dealValue) : 0;
  const conversionRate = leadsAssigned > 0 ? (dealsWon / leadsAssigned) * 100 : 0;
  const followUpCompletionRate = followUpsScheduled > 0 ? (followUpsCompleted / followUpsScheduled) * 100 : 0;

  const metrics: ProductivityMetricsDTO = {
    leadsAssigned,
    verifiedContacts: verifiedContactCustomerIds.length,
    whatsappConversations,
    catalogsSent,
    verifiedCalls,
    selfReportedCalls,
    followUpsCompleted,
    quotationsCreated,
    quotationsSent,
    dealsWon,
    revenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    followUpCompletionRate: Math.round(followUpCompletionRate * 10) / 10,
    score,
  };

  return {
    employee: toUserRef(employee)!,
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    metrics,
  };
}

const METRIC_EVIDENCE_TYPE: Partial<Record<ProductivityMetricKey, { type: EvidenceType; status?: EvidenceStatus }>> = {
  whatsappConversations: { type: "WHATSAPP_MESSAGE_SENT", status: "VERIFIED" },
  catalogsSent: { type: "CATALOG_SENT", status: "VERIFIED" },
  verifiedCalls: { type: "CALL_LOGGED", status: "VERIFIED" },
  selfReportedCalls: { type: "CALL_LOGGED", status: "SELF_REPORTED" },
  followUpsCompleted: { type: "FOLLOW_UP_COMPLETED" },
  quotationsCreated: { type: "QUOTATION_CREATED" },
  quotationsSent: { type: "QUOTATION_SENT" },
  dealsWon: { type: "DEAL_WON" },
};

export async function getProductivityDrilldown(
  actor: RequestingUser,
  employeeId: string,
  metric: ProductivityMetricKey,
  range: ProductivityRange
): Promise<ProductivityDrilldownRowDTO[]> {
  await assertEmployeeVisible(actor, employeeId);
  const { from, to } = getRangeBounds(range);

  if (metric === "leadsAssigned") {
    const rows = await prisma.leadAssignmentHistory.findMany({
      where: { toUserId: employeeId, createdAt: { gte: from, lte: to } },
      include: { lead: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      customer: toCustomerRef(r.lead.customer),
      occurredAt: r.createdAt.toISOString(),
      evidenceId: null,
      type: "LEAD_ASSIGNED",
      status: null,
      refType: "Lead",
      refId: r.leadId,
      summary: `Lead assigned: ${r.lead.customer.name}`,
    }));
  }

  if (metric === "verifiedContacts") {
    const rows = await prisma.evidence.findMany({
      where: { employeeId, status: "VERIFIED", occurredAt: { gte: from, lte: to } },
      include: { customer: true },
      orderBy: { occurredAt: "desc" },
    });
    return rows.map((e) => ({
      customer: toCustomerRef(e.customer),
      occurredAt: e.occurredAt.toISOString(),
      evidenceId: e.id,
      type: e.type,
      status: e.status,
      refType: e.refType,
      refId: e.refId,
      summary: EVIDENCE_TYPE_LABELS[e.type],
    }));
  }

  const filter = METRIC_EVIDENCE_TYPE[metric];
  if (!filter) {
    throw new HttpError(400, `Metric "${metric}" does not support drill-down`);
  }

  const rows = await prisma.evidence.findMany({
    where: {
      employeeId,
      type: filter.type,
      ...(filter.status ? { status: filter.status } : {}),
      occurredAt: { gte: from, lte: to },
    },
    include: { customer: true },
    orderBy: { occurredAt: "desc" },
  });

  return rows.map((e) => ({
    customer: toCustomerRef(e.customer),
    occurredAt: e.occurredAt.toISOString(),
    evidenceId: e.id,
    type: e.type,
    status: e.status,
    refType: e.refType,
    refId: e.refId,
    summary: EVIDENCE_TYPE_LABELS[e.type],
  }));
}

export async function listEvidenceForCustomer(customerId: string) {
  const rows = await prisma.evidence.findMany({ where: { customerId }, include: { employee: true }, orderBy: { occurredAt: "desc" } });
  return rows.map(toEvidenceDTO);
}
