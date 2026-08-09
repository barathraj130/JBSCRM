import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { HttpError } from "@/middleware/errorHandler";
import { logActivity } from "@/services/activityLog.service";
import { toAdminUserDTO, toCustomerDuplicateAttemptDTO, toProductivityScoreConfigDTO, toSystemLogDTO, toWhatsAppTemplateDTO } from "@/utils/mappers";
import type {
  AutomationStatusDTO,
  CreateEmployeeInput,
  CreateWhatsAppTemplateInput,
  UpdateEmployeeInput,
  UpdateProductivityScoreConfigInput,
} from "@indiamart-crm/shared";

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

export async function deleteEmployee(actorId: string, id: string) {
  if (actorId === id) {
    throw new HttpError(400, "You cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, "Employee not found");

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new HttpError(400, "Cannot delete the last remaining admin");
    }
  }

  // Their leads/notes/follow-ups/quotations/activity are kept (owner set to
  // null via onDelete: SetNull) rather than deleted, so historical customer
  // data survives an employee leaving.
  await prisma.user.delete({ where: { id } });
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

export async function listScoreConfig() {
  const rows = await prisma.productivityScoreConfig.findMany({ orderBy: { key: "asc" } });
  return rows.map(toProductivityScoreConfigDTO);
}

export async function updateScoreConfig(actorId: string, input: UpdateProductivityScoreConfigInput) {
  await prisma.$transaction(
    input.map((entry) =>
      prisma.productivityScoreConfig.upsert({
        where: { key: entry.key },
        create: { key: entry.key, points: entry.points, updatedById: actorId },
        update: { points: entry.points, updatedById: actorId },
      })
    )
  );
  await logActivity("productivity_score_config", "all", actorId, "score_config_changed", { input });
  return listScoreConfig();
}

export async function listDuplicateAttempts() {
  const rows = await prisma.customerDuplicateAttempt.findMany({
    include: { attemptedBy: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toCustomerDuplicateAttemptDTO);
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
