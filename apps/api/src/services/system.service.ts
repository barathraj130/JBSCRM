import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { HttpError } from "@/middleware/errorHandler";
import { createNotification } from "@/services/notification.service";

export function verifySystemApiKey(providedKey: string | undefined): void {
  if (!env.n8nApiKey) {
    throw new HttpError(501, "System automation is not configured (set N8N_API_KEY)");
  }
  if (providedKey !== env.n8nApiKey) {
    throw new HttpError(401, "Invalid system API key");
  }
}

/**
 * Meant to be triggered periodically by an external scheduler (n8n cron, Railway cron)
 * since this app has no in-process job runner. Creates an UNCONTACTED_LEAD_ALERT
 * notification for any assigned lead that still has no verified contact evidence past
 * the configured threshold, without duplicating alerts already sent today.
 */
export async function checkUncontactedLeads() {
  const thresholdMs = env.uncontactedLeadAlertMinutes * 60 * 1000;
  const cutoff = new Date(Date.now() - thresholdMs);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const candidates = await prisma.lead.findMany({
    where: { status: "NEW", createdAt: { lte: cutoff }, assignedToId: { not: null } },
    include: { customer: true },
  });
  if (candidates.length === 0) return { alertsCreated: 0 };

  const [contactedLeadIds, alreadyAlertedLeadIds] = await Promise.all([
    prisma.evidence
      .findMany({ where: { leadId: { in: candidates.map((l) => l.id) }, status: "VERIFIED" }, select: { leadId: true } })
      .then((rows) => new Set(rows.map((r) => r.leadId).filter((id): id is string => id !== null))),
    prisma.notification
      .findMany({
        where: {
          type: "UNCONTACTED_LEAD_ALERT",
          entityType: "lead",
          entityId: { in: candidates.map((l) => l.id) },
          createdAt: { gte: startOfToday },
        },
        select: { entityId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.entityId))),
  ]);

  let alertsCreated = 0;
  for (const lead of candidates) {
    if (contactedLeadIds.has(lead.id) || alreadyAlertedLeadIds.has(lead.id) || !lead.assignedToId) continue;
    await createNotification(lead.assignedToId, "UNCONTACTED_LEAD_ALERT", `Uncontacted lead: ${lead.customer.name}`, {
      entityType: "lead",
      entityId: lead.id,
    });
    alertsCreated += 1;
  }

  return { alertsCreated };
}
