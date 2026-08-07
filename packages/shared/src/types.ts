import type { FollowUpStatus, LeadStatus, NotificationType, QuotationStatus, Role, WhatsAppDirection } from "./enums";

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}

export interface UserRefDTO {
  id: string;
  name: string;
  role: Role;
}

export interface CustomerRefDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
}

export interface LeadDTO {
  id: string;
  customer: CustomerRefDTO;
  productInterested: string | null;
  source: string;
  status: LeadStatus;
  assignedTo: UserRefDTO | null;
  dealValue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDTO {
  id: string;
  body: string;
  author: UserRefDTO;
  createdAt: string;
}

export interface FollowUpDTO {
  id: string;
  leadId: string;
  dueAt: string;
  notes: string | null;
  status: FollowUpStatus;
  outcome: string | null;
  user: UserRefDTO;
  createdAt: string;
}

export interface ActivityLogDTO {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  user: UserRefDTO | null;
  createdAt: string;
}

export interface CustomerDetailDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  updatedAt: string;
  leads: LeadDTO[];
  notes: NoteDTO[];
  followUps: FollowUpDTO[];
  activityLogs: ActivityLogDTO[];
  whatsAppMessages: WhatsAppMessageDTO[];
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  productInterested?: string;
  source?: string;
  notes?: string;
  assignedToId?: string;
}

export interface DuplicateCustomerError {
  error: "DUPLICATE_CUSTOMER";
  customerId: string;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  assignedToId?: string | null;
  dealValue?: number | null;
  productInterested?: string;
}

export interface BulkUpdateLeadsInput {
  ids: string[];
  status?: LeadStatus;
  assignedToId?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  subcategory: string | null;
  images: string[];
  videos: string[];
  brochureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  subcategory?: string;
  images?: string[];
  videos?: string[];
  brochureUrl?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface QuotationItemDTO {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuotationDTO {
  id: string;
  customer: CustomerRefDTO;
  status: QuotationStatus;
  gstPercent: number;
  discount: number;
  subtotal: number;
  total: number;
  pdfUrl: string | null;
  createdBy: UserRefDTO;
  items: QuotationItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationInput {
  customerId: string;
  leadId?: string;
  gstPercent?: number;
  discount?: number;
  items: { productId?: string; name: string; quantity: number; unitPrice: number }[];
}

export interface WhatsAppMessageDTO {
  id: string;
  direction: WhatsAppDirection;
  body: string;
  mediaUrl: string | null;
  sentBy: UserRefDTO | null;
  createdAt: string;
}

export type AISentiment = "positive" | "neutral" | "negative";

export interface AISuggestReplyResponse {
  reply: string;
}

export interface AISummarizeResponse {
  summary: string;
}

export interface AISentimentResponse {
  sentiment: AISentiment;
}

export interface AINextBestActionResponse {
  action: string;
}

export interface AITranslateResponse {
  translated: string;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface WhatsAppTemplateDTO {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsAppTemplateInput {
  name: string;
  body: string;
}

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  managerId: string | null;
  managerName: string | null;
  createdAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  managerId?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  role?: Role;
  managerId?: string | null;
  isActive?: boolean;
}

export interface SystemLogDTO {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  user: UserRefDTO | null;
  createdAt: string;
}

export interface AutomationStatusDTO {
  whatsappProvider: string;
  n8nWebhookConfigured: boolean;
  n8nApiKeyConfigured: boolean;
  aiConfigured: boolean;
  aiModel: string;
  companyName: string;
}

export interface ReportEmployeeRow {
  userId: string;
  name: string;
  leadsAssigned: number;
  leadsWon: number;
  leadsLost: number;
  revenue: number;
  conversionRate: number;
  followUpsCompleted: number;
}

export interface ReportBreakdownRow {
  label: string;
  count: number;
}

export interface ReportSummaryDTO {
  from: string;
  to: string;
  totalLeads: number;
  wonDeals: number;
  lostDeals: number;
  revenue: number;
  conversionRate: number;
  byEmployee: ReportEmployeeRow[];
  bySource: ReportBreakdownRow[];
  byStatus: ReportBreakdownRow[];
}

export interface DashboardSummaryDTO {
  totalLeads: number;
  newLeadsToday: number;
  pendingFollowUps: number;
  closedDeals: number;
  lostDeals: number;
  revenue: number;
  conversionRate: number;
  leadsByStatus: Record<LeadStatus, number>;
  dailyLeadTrend: { date: string; count: number }[];
}
