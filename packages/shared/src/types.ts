import type {
  CallDirection,
  EvidenceStatus,
  EvidenceType,
  FollowUpStatus,
  LeadStatus,
  NotificationType,
  QuotationStatus,
  Role,
  WhatsAppDirection,
} from "./enums";
import type { PermissionKey } from "./permissions";

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
  externalLeadId: string | null;
  rawSourcePayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDTO {
  id: string;
  body: string;
  author: UserRefDTO | null;
  createdAt: string;
  isEdited: boolean;
  previousVersionId: string | null;
}

export interface FollowUpDTO {
  id: string;
  leadId: string;
  dueAt: string;
  notes: string | null;
  status: FollowUpStatus;
  outcome: string | null;
  user: UserRefDTO | null;
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
  /** Required when moving status to CONTACTED and no verified contact evidence exists yet. */
  evidenceImageUrl?: string;
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

export interface CategoryRefDTO {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: CategoryRefDTO | null;
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
  categoryId: string;
  images?: string[];
  videos?: string[];
  brochureUrl?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface CategoryDTO {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryDTO[];
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  parentId?: string | null;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CatalogDTO {
  id: string;
  name: string;
  description: string | null;
  category: CategoryRefDTO | null;
  products: ProductDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogInput {
  name: string;
  description?: string;
  categoryId?: string;
  productIds: string[];
}

export type UpdateCatalogInput = Partial<CreateCatalogInput>;

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
  leadId: string | null;
  status: QuotationStatus;
  gstPercent: number;
  discount: number;
  subtotal: number;
  total: number;
  pdfUrl: string | null;
  createdBy: UserRefDTO | null;
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
  catalogId: string | null;
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

// ---- Evidence & verification ----

export interface EvidenceDTO {
  id: string;
  customerId: string;
  leadId: string | null;
  employee: UserRefDTO | null;
  type: EvidenceType;
  status: EvidenceStatus;
  refType: string;
  refId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CustomerTimelineEntryDTO {
  id: string;
  kind: "evidence" | "activity";
  type: string;
  status: EvidenceStatus | null;
  label: string;
  occurredAt: string;
  user: UserRefDTO | null;
  metadata: Record<string, unknown> | null;
}

export interface CallDTO {
  id: string;
  customerId: string;
  employee: UserRefDTO | null;
  direction: CallDirection;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  status: string;
  outcome: string | null;
  recordingRef: string | null;
  isSelfReported: true;
  createdAt: string;
}

export interface CreateCallInput {
  customerId: string;
  direction: CallDirection;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: string;
  outcome?: string;
}

export interface LeadAssignmentHistoryDTO {
  id: string;
  fromUser: UserRefDTO | null;
  toUser: UserRefDTO | null;
  changedBy: UserRefDTO | null;
  reason: string | null;
  createdAt: string;
}

export interface CustomerDuplicateAttemptDTO {
  id: string;
  phone: string;
  attemptedBy: UserRefDTO | null;
  existingCustomerId: string;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  objectType: string;
  objectId: string | null;
  oldValue: unknown;
  newValue: unknown;
  source: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  objectType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPageDTO {
  items: AuditLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductivityScoreConfigDTO {
  key: string;
  label: string;
  points: number;
  updatedAt: string;
}

export type UpdateProductivityScoreConfigInput = { key: string; points: number }[];

// ---- Permissions ----

export interface UserPermissionOverrideDTO {
  key: PermissionKey;
  granted: boolean;
}

export interface EmployeePermissionsDTO {
  userId: string;
  role: Role;
  defaults: PermissionKey[];
  overrides: UserPermissionOverrideDTO[];
  effective: PermissionKey[];
}

export type UpdateEmployeePermissionsInput = UserPermissionOverrideDTO[];

// ---- Productivity ----

export type ProductivityRange = "daily" | "weekly" | "monthly";

export interface ProductivityMetricsDTO {
  leadsAssigned: number;
  verifiedContacts: number;
  whatsappConversations: number;
  catalogsSent: number;
  verifiedCalls: number;
  selfReportedCalls: number;
  followUpsCompleted: number;
  quotationsCreated: number;
  quotationsSent: number;
  dealsWon: number;
  revenue: number;
  conversionRate: number;
  followUpCompletionRate: number;
  score: number;
}

export interface ProductivitySummaryDTO {
  employee: UserRefDTO;
  range: ProductivityRange;
  from: string;
  to: string;
  metrics: ProductivityMetricsDTO;
}

export type ProductivityMetricKey = keyof ProductivityMetricsDTO;

export interface ProductivityDrilldownRowDTO {
  customer: CustomerRefDTO;
  occurredAt: string;
  evidenceId: string | null;
  type: string;
  status: EvidenceStatus | null;
  refType: string | null;
  refId: string | null;
  summary: string;
}

// ---- Uncontacted lead alerts ----

export interface UncontactedLeadAlertDTO {
  lead: LeadDTO;
  minutesSinceCreated: number;
}
