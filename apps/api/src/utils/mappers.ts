import type {
  ActivityLog,
  AuditLog,
  Call,
  Catalog,
  CatalogProduct,
  Category,
  Customer,
  CustomerDuplicateAttempt,
  Evidence,
  FollowUp,
  Lead,
  LeadAssignmentHistory,
  Note,
  Product,
  ProductivityScoreConfig,
  Quotation,
  QuotationItem,
  User,
  WhatsAppMessage,
  WhatsAppTemplate,
} from "@prisma/client";
import type {
  ActivityLogDTO,
  AdminUserDTO,
  AuditLogDTO,
  CallDTO,
  CatalogDTO,
  CategoryDTO,
  CategoryRefDTO,
  CustomerDuplicateAttemptDTO,
  CustomerListItemDTO,
  CustomerRefDTO,
  EvidenceDTO,
  FollowUpDTO,
  LeadAssignmentHistoryDTO,
  LeadDTO,
  NoteDTO,
  ProductDTO,
  ProductivityScoreConfigDTO,
  QuotationDTO,
  QuotationItemDTO,
  SystemLogDTO,
  UserRefDTO,
  WhatsAppMessageDTO,
  WhatsAppTemplateDTO,
} from "@indiamart-crm/shared";
import { EVIDENCE_TYPE_LABELS, type EvidenceType } from "@indiamart-crm/shared";

export function toUserRef(user: Pick<User, "id" | "name" | "role"> | null): UserRefDTO | null {
  if (!user) return null;
  return { id: user.id, name: user.name, role: user.role };
}

export function toCustomerRef(customer: Customer): CustomerRefDTO {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    company: customer.company,
    city: customer.city,
    state: customer.state,
  };
}

export function toCustomerListItemDTO(
  customer: Customer & { leads: (Lead & { assignedTo: User | null })[] }
): CustomerListItemDTO {
  const latestLead = customer.leads[0] ?? null;
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    company: customer.company,
    city: customer.city,
    state: customer.state,
    leadCount: customer.leads.length,
    latestLeadStatus: latestLead?.status ?? null,
    assignedTo: toUserRef(latestLead?.assignedTo ?? null),
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export function toLeadDTO(lead: Lead & { customer: Customer; assignedTo: User | null }): LeadDTO {
  return {
    id: lead.id,
    customer: toCustomerRef(lead.customer),
    productInterested: lead.productInterested,
    source: lead.source,
    status: lead.status,
    assignedTo: toUserRef(lead.assignedTo),
    dealValue: lead.dealValue ? Number(lead.dealValue) : null,
    externalLeadId: lead.externalLeadId,
    rawSourcePayload: (lead.rawSourcePayload as Record<string, unknown> | null) ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function toNoteDTO(note: Note & { author: User | null }): NoteDTO {
  return {
    id: note.id,
    body: note.body,
    author: toUserRef(note.author),
    createdAt: note.createdAt.toISOString(),
    isEdited: note.previousVersionId !== null,
    previousVersionId: note.previousVersionId,
  };
}

export function toFollowUpDTO(followUp: FollowUp & { user: User | null }): FollowUpDTO {
  return {
    id: followUp.id,
    leadId: followUp.leadId,
    dueAt: followUp.dueAt.toISOString(),
    notes: followUp.notes,
    status: followUp.status,
    outcome: followUp.outcome,
    user: toUserRef(followUp.user),
    createdAt: followUp.createdAt.toISOString(),
  };
}

export function toCategoryRef(category: (Category & { parent: Category | null }) | null): CategoryRefDTO | null {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    path: category.parent ? `${category.parent.name} > ${category.name}` : category.name,
  };
}

export function toCategoryDTO(category: Category & { children?: Category[] }): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    children: (category.children ?? []).map((c) => toCategoryDTO(c)),
    createdAt: category.createdAt.toISOString(),
  };
}

export function toProductDTO(product: Product & { category: (Category & { parent: Category | null }) | null }): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    category: toCategoryRef(product.category),
    images: product.images,
    videos: product.videos,
    brochureUrl: product.brochureUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toCatalogDTO(
  catalog: Catalog & {
    category: (Category & { parent: Category | null }) | null;
    products: (CatalogProduct & { product: Product & { category: (Category & { parent: Category | null }) | null } })[];
  }
): CatalogDTO {
  return {
    id: catalog.id,
    name: catalog.name,
    description: catalog.description,
    category: toCategoryRef(catalog.category),
    products: catalog.products.map((cp) => toProductDTO(cp.product)),
    createdAt: catalog.createdAt.toISOString(),
    updatedAt: catalog.updatedAt.toISOString(),
  };
}

export function toQuotationItemDTO(item: QuotationItem): QuotationItemDTO {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    lineTotal: item.quantity * Number(item.unitPrice),
  };
}

export function toQuotationDTO(
  quotation: Quotation & { customer: Customer; createdBy: User | null; items: QuotationItem[] }
): QuotationDTO {
  const items = quotation.items.map(toQuotationItemDTO);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: quotation.id,
    customer: toCustomerRef(quotation.customer),
    leadId: quotation.leadId,
    status: quotation.status,
    gstPercent: Number(quotation.gstPercent),
    discount: Number(quotation.discount),
    subtotal,
    total: Number(quotation.total),
    pdfUrl: quotation.pdfUrl,
    createdBy: toUserRef(quotation.createdBy),
    items,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
  };
}

export function toWhatsAppMessageDTO(message: WhatsAppMessage & { sentBy: User | null }): WhatsAppMessageDTO {
  return {
    id: message.id,
    direction: message.direction,
    body: message.body,
    mediaUrl: message.mediaUrl,
    catalogId: message.catalogId,
    sentBy: toUserRef(message.sentBy),
    createdAt: message.createdAt.toISOString(),
  };
}

export function toActivityLogDTO(log: ActivityLog & { user: User | null }): ActivityLogDTO {
  return {
    id: log.id,
    action: log.action,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    user: toUserRef(log.user),
    createdAt: log.createdAt.toISOString(),
  };
}

export function toSystemLogDTO(log: ActivityLog & { user: User | null }): SystemLogDTO {
  return {
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    user: toUserRef(log.user),
    createdAt: log.createdAt.toISOString(),
  };
}

export function toAdminUserDTO(user: User & { manager: User | null }): AdminUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    managerId: user.managerId,
    managerName: user.manager?.name ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toWhatsAppTemplateDTO(template: WhatsAppTemplate): WhatsAppTemplateDTO {
  return {
    id: template.id,
    name: template.name,
    body: template.body,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toEvidenceDTO(evidence: Evidence & { employee: User | null }): EvidenceDTO {
  return {
    id: evidence.id,
    customerId: evidence.customerId,
    leadId: evidence.leadId,
    employee: toUserRef(evidence.employee),
    type: evidence.type,
    status: evidence.status,
    refType: evidence.refType,
    refId: evidence.refId,
    occurredAt: evidence.occurredAt.toISOString(),
    metadata: (evidence.metadata as Record<string, unknown> | null) ?? null,
    createdAt: evidence.createdAt.toISOString(),
  };
}

export function toCallDTO(call: Call & { employee: User | null }): CallDTO {
  return {
    id: call.id,
    customerId: call.customerId,
    employee: toUserRef(call.employee),
    direction: call.direction,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt ? call.endedAt.toISOString() : null,
    durationSeconds: call.durationSeconds,
    status: call.status,
    outcome: call.outcome,
    recordingRef: call.recordingRef,
    isSelfReported: true,
    createdAt: call.createdAt.toISOString(),
  };
}

export function toLeadAssignmentHistoryDTO(
  entry: LeadAssignmentHistory & { fromUser: User | null; toUser: User | null; changedBy: User | null }
): LeadAssignmentHistoryDTO {
  return {
    id: entry.id,
    fromUser: toUserRef(entry.fromUser),
    toUser: toUserRef(entry.toUser),
    changedBy: toUserRef(entry.changedBy),
    reason: entry.reason,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function toCustomerDuplicateAttemptDTO(
  attempt: CustomerDuplicateAttempt & { attemptedBy: User | null }
): CustomerDuplicateAttemptDTO {
  return {
    id: attempt.id,
    phone: attempt.phone,
    attemptedBy: toUserRef(attempt.attemptedBy),
    existingCustomerId: attempt.existingCustomerId,
    createdAt: attempt.createdAt.toISOString(),
  };
}

export function toAuditLogDTO(log: AuditLog): AuditLogDTO {
  return {
    id: log.id,
    actorName: log.actorName,
    actorEmail: log.actorEmail,
    action: log.action,
    objectType: log.objectType,
    objectId: log.objectId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    source: log.source,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  };
}

export function toProductivityScoreConfigDTO(config: ProductivityScoreConfig): ProductivityScoreConfigDTO {
  return {
    key: config.key,
    label: EVIDENCE_TYPE_LABELS[config.key as EvidenceType] ?? config.key,
    points: config.points,
    updatedAt: config.updatedAt.toISOString(),
  };
}
