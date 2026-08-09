import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { env } from "@/lib/env";
import { toLeadDTO } from "@/utils/mappers";
import { logActivity } from "@/services/activityLog.service";
import { recordEvidence } from "@/services/evidence.service";
import { indiaMartProvider } from "@/integrations/indiamart";

export function verifyIndiaMartApiKey(providedKey: string | undefined): void {
  if (!env.indiamartApiKey) {
    throw new HttpError(501, "IndiaMART webhook is not configured (set INDIAMART_API_KEY)");
  }
  if (providedKey !== env.indiamartApiKey) {
    throw new HttpError(401, "Invalid IndiaMART API key");
  }
}

const leadInclude = { customer: true, assignedTo: true } satisfies Prisma.LeadInclude;

/**
 * Imports a lead pushed by IndiaMART's Lead Manager webhook. Unlike the manual-entry
 * duplicate-phone guard (which refuses to create a second Customer), a repeat inquiry
 * from a known phone number is still a real new business event — it creates a new Lead
 * against the existing Customer rather than being dropped.
 */
export async function importIndiaMartLead(rawBody: Record<string, unknown>) {
  const payload = indiaMartProvider.parseLeadPayload(rawBody);

  const existingByExternalId = await prisma.lead.findUnique({
    where: { externalLeadId: payload.externalLeadId },
    include: leadInclude,
  });
  if (existingByExternalId) {
    // Idempotent: webhook redelivery of a lead we've already imported.
    return toLeadDTO(existingByExternalId);
  }

  let customer = await prisma.customer.findUnique({ where: { phone: payload.phone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        company: payload.company,
        city: payload.city,
        state: payload.state,
      },
    });
  }

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      productInterested: payload.productInterested,
      source: "IndiaMART",
      externalLeadId: payload.externalLeadId,
      rawSourcePayload: rawBody as Prisma.InputJsonValue,
    },
    include: leadInclude,
  });

  if (payload.message) {
    await prisma.note.create({
      data: { customerId: customer.id, authorId: null, body: `IndiaMART inquiry: ${payload.message}` },
    });
  }

  await recordEvidence({
    customerId: customer.id,
    leadId: lead.id,
    employeeId: null,
    type: "LEAD_IMPORTED",
    status: "VERIFIED",
    refType: "Lead",
    refId: lead.id,
    occurredAt: new Date(payload.receivedAt),
    metadata: { externalLeadId: payload.externalLeadId, source: "IndiaMART" },
  });

  await logActivity("lead", lead.id, null, "lead_imported_indiamart", {
    externalLeadId: payload.externalLeadId,
    customerId: customer.id,
  });

  return toLeadDTO(lead);
}
