import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toFollowUpDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { recordEvidence } from "@/services/evidence.service";

export async function createFollowUp(actor: RequestingUser, leadId: string, dueAt: Date, notes?: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new HttpError(404, "Lead not found");
  if (visibleUserIds && (!lead.assignedToId || !visibleUserIds.includes(lead.assignedToId))) {
    throw new HttpError(403, "You do not have access to this lead");
  }

  const followUp = await prisma.followUp.create({
    data: { leadId, userId: actor.id, dueAt, notes },
    include: { user: true },
  });

  await logActivity("lead", leadId, actor.id, "follow_up_scheduled", { dueAt: dueAt.toISOString() });
  await recordEvidence({
    customerId: lead.customerId,
    leadId,
    employeeId: actor.id,
    type: "FOLLOW_UP_SCHEDULED",
    status: "VERIFIED",
    refType: "FollowUp",
    refId: followUp.id,
    occurredAt: followUp.createdAt,
  });

  return toFollowUpDTO(followUp);
}

export async function completeFollowUp(actor: RequestingUser, followUpId: string, outcome?: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId }, include: { lead: true } });
  if (!followUp) throw new HttpError(404, "Follow-up not found");
  if (visibleUserIds && (!followUp.lead.assignedToId || !visibleUserIds.includes(followUp.lead.assignedToId))) {
    throw new HttpError(403, "You do not have access to this follow-up");
  }

  const updated = await prisma.followUp.update({
    where: { id: followUpId },
    data: { status: "COMPLETED", outcome },
    include: { user: true },
  });

  await logActivity("lead", followUp.leadId, actor.id, "follow_up_completed", { outcome });
  await recordEvidence({
    customerId: followUp.lead.customerId,
    leadId: followUp.leadId,
    employeeId: actor.id,
    type: "FOLLOW_UP_COMPLETED",
    status: "VERIFIED",
    refType: "FollowUp",
    refId: followUp.id,
    metadata: { outcome: outcome ?? null },
  });

  return toFollowUpDTO(updated);
}
