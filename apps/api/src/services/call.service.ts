import { prisma } from "@/lib/prisma";
import { assertCustomerAccess } from "@/services/customer.service";
import { recordEvidence } from "@/services/evidence.service";
import { logActivity } from "@/services/activityLog.service";
import { toCallDTO } from "@/utils/mappers";
import type { RequestingUser } from "@/utils/leadScope";
import type { CreateCallInput } from "@indiamart-crm/shared";

export async function logCall(actor: RequestingUser, input: CreateCallInput) {
  const customer = await assertCustomerAccess(actor, input.customerId);

  const call = await prisma.call.create({
    data: {
      customerId: input.customerId,
      employeeId: actor.id,
      direction: input.direction,
      startedAt: new Date(input.startedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      durationSeconds: input.durationSeconds ?? null,
      status: input.status,
      outcome: input.outcome,
    },
    include: { employee: true },
  });

  const assignedLead = await prisma.lead.findFirst({ where: { customerId: input.customerId, assignedToId: { not: null } }, orderBy: { createdAt: "desc" } });

  // No telephony integration exists to verify this call, so it is always recorded as SELF_REPORTED
  // — never presented as equivalent to a system-verified WhatsApp send or catalog delivery.
  await recordEvidence({
    customerId: input.customerId,
    leadId: assignedLead?.id ?? null,
    employeeId: actor.id,
    type: "CALL_LOGGED",
    status: "SELF_REPORTED",
    refType: "Call",
    refId: call.id,
    occurredAt: call.startedAt,
    metadata: { direction: input.direction, status: input.status, outcome: input.outcome ?? null },
  });

  await logActivity("customer", input.customerId, actor.id, "call_logged_self_reported", {
    direction: input.direction,
    status: input.status,
    customerName: customer.name,
  });

  return toCallDTO(call);
}

export async function listCallsForCustomer(actor: RequestingUser, customerId: string) {
  await assertCustomerAccess(actor, customerId);
  const calls = await prisma.call.findMany({ where: { customerId }, include: { employee: true }, orderBy: { startedAt: "desc" } });
  return calls.map(toCallDTO);
}
