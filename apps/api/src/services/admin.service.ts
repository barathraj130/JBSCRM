import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { HttpError } from "@/middleware/errorHandler";
import { toAdminUserDTO, toSystemLogDTO, toWhatsAppTemplateDTO } from "@/utils/mappers";
import type { AutomationStatusDTO, CreateEmployeeInput, CreateWhatsAppTemplateInput, UpdateEmployeeInput } from "@indiamart-crm/shared";

const userInclude = { manager: true } as const;

export async function listEmployees() {
  const users = await prisma.user.findMany({ include: userInclude, orderBy: { name: "asc" } });
  return users.map(toAdminUserDTO);
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "A user with that email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role, managerId: input.managerId },
    include: userInclude,
  });
  return toAdminUserDTO(user);
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const user = await prisma.user.update({ where: { id }, data: input, include: userInclude });
  return toAdminUserDTO(user);
}

export async function listWhatsAppTemplates() {
  const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { name: "asc" } });
  return templates.map(toWhatsAppTemplateDTO);
}

export async function createWhatsAppTemplate(input: CreateWhatsAppTemplateInput) {
  const template = await prisma.whatsAppTemplate.create({ data: input });
  return toWhatsAppTemplateDTO(template);
}

export async function updateWhatsAppTemplate(id: string, input: Partial<CreateWhatsAppTemplateInput>) {
  const template = await prisma.whatsAppTemplate.update({ where: { id }, data: input });
  return toWhatsAppTemplateDTO(template);
}

export async function deleteWhatsAppTemplate(id: string) {
  await prisma.whatsAppTemplate.delete({ where: { id } });
}

export async function listSystemLogs() {
  const logs = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return logs.map(toSystemLogDTO);
}

export function getAutomationStatus(): AutomationStatusDTO {
  return {
    whatsappProvider: env.whatsappProvider,
    n8nWebhookConfigured: Boolean(env.n8nWebhookUrl),
    n8nApiKeyConfigured: Boolean(env.n8nApiKey),
    aiConfigured: Boolean(env.anthropicApiKey),
    aiModel: env.aiModel,
    companyName: env.companyName,
  };
}
