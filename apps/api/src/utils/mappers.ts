import type {
  ActivityLog,
  Customer,
  FollowUp,
  Lead,
  Note,
  Product,
  Quotation,
  QuotationItem,
  User,
  WhatsAppMessage,
  WhatsAppTemplate,
} from "@prisma/client";
import type {
  ActivityLogDTO,
  AdminUserDTO,
  CustomerRefDTO,
  FollowUpDTO,
  LeadDTO,
  NoteDTO,
  ProductDTO,
  QuotationDTO,
  QuotationItemDTO,
  SystemLogDTO,
  UserRefDTO,
  WhatsAppMessageDTO,
  WhatsAppTemplateDTO,
} from "@indiamart-crm/shared";

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

export function toLeadDTO(lead: Lead & { customer: Customer; assignedTo: User | null }): LeadDTO {
  return {
    id: lead.id,
    customer: toCustomerRef(lead.customer),
    productInterested: lead.productInterested,
    source: lead.source,
    status: lead.status,
    assignedTo: toUserRef(lead.assignedTo),
    dealValue: lead.dealValue ? Number(lead.dealValue) : null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function toNoteDTO(note: Note & { author: User }): NoteDTO {
  return {
    id: note.id,
    body: note.body,
    author: toUserRef(note.author)!,
    createdAt: note.createdAt.toISOString(),
  };
}

export function toFollowUpDTO(followUp: FollowUp & { user: User }): FollowUpDTO {
  return {
    id: followUp.id,
    leadId: followUp.leadId,
    dueAt: followUp.dueAt.toISOString(),
    notes: followUp.notes,
    status: followUp.status,
    outcome: followUp.outcome,
    user: toUserRef(followUp.user)!,
    createdAt: followUp.createdAt.toISOString(),
  };
}

export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    category: product.category,
    subcategory: product.subcategory,
    images: product.images,
    videos: product.videos,
    brochureUrl: product.brochureUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
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
  quotation: Quotation & { customer: Customer; createdBy: User; items: QuotationItem[] }
): QuotationDTO {
  const items = quotation.items.map(toQuotationItemDTO);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: quotation.id,
    customer: toCustomerRef(quotation.customer),
    status: quotation.status,
    gstPercent: Number(quotation.gstPercent),
    discount: Number(quotation.discount),
    subtotal,
    total: Number(quotation.total),
    pdfUrl: quotation.pdfUrl,
    createdBy: toUserRef(quotation.createdBy)!,
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
