import { prisma } from "@/lib/prisma";
import { EvidenceRequiredError, HttpError } from "@/middleware/errorHandler";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toFollowUpDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { hasVerifiedContactEvidence, recordContactProof, recordEvidence } from "@/services/evidence.service";

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

export async function completeFollowUp(actor: RequestingUser, followUpId: string, outcome?: string, evidenceImageUrl?: string) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId }, include: { lead: true } });
  if (!followUp) throw new HttpError(404, "Follow-up not found");
  if (visibleUserIds && (!followUp.lead.assignedToId || !visibleUserIds.includes(followUp.lead.assignedToId))) {
    throw new HttpError(403, "You do not have access to this follow-up");
  }

  // Completing the task itself is a real, verifiable system action — but that alone doesn't
  // prove the customer was actually reached. If nothing else already verifies contact for this
  // lead (an in-app WhatsApp send, a verified call), a screenshot is required as proof of the
  // follow-up (e.g. a personal WhatsApp/SMS message) before it's marked complete.
  const verifiedContact = await hasVerifiedContactEvidence(followUp.leadId);
  if (!verifiedContact) {
    if (!evidenceImageUrl) {
      throw new EvidenceRequiredError("Please upload a screenshot as evidence of this follow-up contact.");
    }
    await recordContactProof({
      customerId: followUp.lead.customerId,
      leadId: followUp.leadId,
      employeeId: actor.id,
      imageUrl: evidenceImageUrl,
      note: outcome ? `Follow-up: ${outcome}` : "Follow-up",
    });
    await logActivity("customer", followUp.lead.customerId, actor.id, "contact_proof_uploaded", {
      leadId: followUp.leadId,
      followUpId,
      imageUrl: evidenceImageUrl,
    });
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
