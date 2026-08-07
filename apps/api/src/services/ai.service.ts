import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/integrations/ai";
import { assertCustomerAccess } from "@/services/customer.service";
import type { RequestingUser } from "@/utils/leadScope";
import type { AISentiment } from "@indiamart-crm/shared";

async function getConversationText(customerId: string): Promise<string> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  if (messages.length === 0) return "(no WhatsApp conversation yet)";
  return messages.map((m) => `${m.direction === "INBOUND" ? "Customer" : "Us"}: ${m.body}`).join("\n");
}

async function getLeadSummary(customerId: string): Promise<string> {
  const [customer, leads] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: customerId } }),
    prisma.lead.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } }),
  ]);
  const leadLines = leads
    .map((l) => `- ${l.productInterested ?? "General inquiry"}: status=${l.status}, source=${l.source}, created=${l.createdAt.toDateString()}`)
    .join("\n");
  return `Customer: ${customer.name} (${customer.company ?? "no company"})\nLeads:\n${leadLines || "(none)"}`;
}

export async function suggestReply(actor: RequestingUser, customerId: string) {
  await assertCustomerAccess(actor, customerId);
  const conversation = await getConversationText(customerId);
  const leadSummary = await getLeadSummary(customerId);
  const reply = await getAIProvider().suggestReply(conversation, leadSummary);
  return { reply };
}

export async function summarizeConversation(actor: RequestingUser, customerId: string) {
  await assertCustomerAccess(actor, customerId);
  const conversation = await getConversationText(customerId);
  const summary = await getAIProvider().summarizeConversation(conversation);
  return { summary };
}

export async function detectSentiment(actor: RequestingUser, customerId: string) {
  await assertCustomerAccess(actor, customerId);
  const conversation = await getConversationText(customerId);
  const sentiment = (await getAIProvider().detectSentiment(conversation)) as AISentiment;
  return { sentiment };
}

export async function nextBestAction(actor: RequestingUser, customerId: string) {
  await assertCustomerAccess(actor, customerId);
  const leadSummary = await getLeadSummary(customerId);
  const action = await getAIProvider().nextBestAction(leadSummary);
  return { action };
}

export async function translate(text: string, targetLanguage: "en" | "ta" | "hi") {
  const translated = await getAIProvider().translate(text, targetLanguage);
  return { translated };
}
