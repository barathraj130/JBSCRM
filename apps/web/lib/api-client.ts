import type {
  AdminUserDTO,
  AISentimentResponse,
  AISuggestReplyResponse,
  AISummarizeResponse,
  AINextBestActionResponse,
  AITranslateResponse,
  AuditLogDTO,
  AuditLogFilter,
  AuditLogPageDTO,
  AuthUserDTO,
  AutomationStatusDTO,
  BulkUpdateLeadsInput,
  CallDTO,
  CatalogDTO,
  CategoryDTO,
  CreateCallInput,
  CreateCatalogInput,
  CreateCategoryInput,
  CreateEmployeeInput,
  CustomerDuplicateAttemptDTO,
  CreateLeadInput,
  CreateProductInput,
  CreateQuotationInput,
  CreateWhatsAppTemplateInput,
  CustomerDetailDTO,
  CustomerRefDTO,
  CustomerTimelineEntryDTO,
  DashboardSummaryDTO,
  EmployeePermissionsDTO,
  FollowUpDTO,
  LeadAssignmentHistoryDTO,
  LeadDTO,
  LeadStatus,
  LoginResponseDTO,
  NoteDTO,
  NotificationDTO,
  ProductDTO,
  ProductivityDrilldownRowDTO,
  ProductivityMetricKey,
  ProductivityRange,
  ProductivityScoreConfigDTO,
  ProductivitySummaryDTO,
  QuotationDTO,
  ReportSummaryDTO,
  SystemLogDTO,
  UncontactedLeadAlertDTO,
  UpdateCatalogInput,
  UpdateCategoryInput,
  UpdateCustomerInput,
  UpdateEmployeeInput,
  UpdateEmployeePermissionsInput,
  UpdateLeadInput,
  UpdateProductInput,
  UpdateProductivityScoreConfigInput,
  UserRefDTO,
  WhatsAppMessageDTO,
  WhatsAppTemplateDTO,
} from "@indiamart-crm/shared";
import { clearTokens, getRefreshToken, setAccessToken } from "@/lib/token-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code?: string;
  customerId?: string;
  constructor(status: number, message: string, code?: string, customerId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.customerId = customerId;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = (await res.json()) as { accessToken: string };
        setAccessToken(body.accessToken);
        window.dispatchEvent(new CustomEvent("auth:token-refreshed", { detail: body.accessToken }));
        return body.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string, _retried = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && !_retried && !path.startsWith("/api/auth/")) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, options, newToken, true);
      }
      clearTokens();
      window.dispatchEvent(new Event("auth:logout"));
    }
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.message ?? body.error ?? "Request failed", body.error, body.customerId);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function login(email: string, password: string): Promise<LoginResponseDTO> {
  return request<LoginResponseDTO>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string): Promise<AuthUserDTO> {
  return request<AuthUserDTO>("/api/auth/me", {}, token);
}

export function getDashboardSummary(token: string): Promise<DashboardSummaryDTO> {
  return request<DashboardSummaryDTO>("/api/dashboard/summary", {}, token);
}

export interface ListLeadsParams {
  q?: string;
  status?: LeadStatus[];
  assignedToId?: string;
  sortBy?: "createdAt" | "status" | "customerName";
  sortDir?: "asc" | "desc";
}

export function listLeads(token: string, params: ListLeadsParams = {}): Promise<LeadDTO[]> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status?.length) query.set("status", params.status.join(","));
  if (params.assignedToId) query.set("assignedToId", params.assignedToId);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  const qs = query.toString();
  return request<LeadDTO[]>(`/api/leads${qs ? `?${qs}` : ""}`, {}, token);
}

export function createLead(token: string, input: CreateLeadInput): Promise<LeadDTO> {
  return request<LeadDTO>("/api/leads", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateLead(token: string, id: string, input: UpdateLeadInput): Promise<LeadDTO> {
  return request<LeadDTO>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function bulkUpdateLeads(token: string, input: BulkUpdateLeadsInput): Promise<{ updated: number }> {
  return request<{ updated: number }>("/api/leads/bulk", { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function getCustomer(token: string, id: string): Promise<CustomerDetailDTO> {
  return request<CustomerDetailDTO>(`/api/customers/${id}`, {}, token);
}

export function lookupCustomerByPhone(token: string, phone: string): Promise<CustomerRefDTO | null> {
  return request<CustomerRefDTO | null>(`/api/customers/lookup?phone=${encodeURIComponent(phone)}`, {}, token);
}

export function updateCustomer(token: string, id: string, input: UpdateCustomerInput): Promise<CustomerRefDTO> {
  return request<CustomerRefDTO>(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function addNote(token: string, customerId: string, body: string): Promise<NoteDTO> {
  return request<NoteDTO>(`/api/customers/${customerId}/notes`, { method: "POST", body: JSON.stringify({ body }) }, token);
}

export function createFollowUp(token: string, input: { leadId: string; dueAt: string; notes?: string }): Promise<FollowUpDTO> {
  return request<FollowUpDTO>("/api/follow-ups", { method: "POST", body: JSON.stringify(input) }, token);
}

export function completeFollowUp(token: string, id: string, outcome?: string): Promise<FollowUpDTO> {
  return request<FollowUpDTO>(`/api/follow-ups/${id}/complete`, { method: "PATCH", body: JSON.stringify({ outcome }) }, token);
}

export function listUsers(token: string): Promise<UserRefDTO[]> {
  return request<UserRefDTO[]>("/api/users", {}, token);
}

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.message ?? body.error ?? "Upload failed");
  }
  return res.json();
}

export interface ListProductsParams {
  q?: string;
  categoryId?: string;
}

export function listProducts(token: string, params: ListProductsParams = {}): Promise<ProductDTO[]> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  const qs = query.toString();
  return request<ProductDTO[]>(`/api/products${qs ? `?${qs}` : ""}`, {}, token);
}

export function createProduct(token: string, input: CreateProductInput): Promise<ProductDTO> {
  return request<ProductDTO>("/api/products", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateProduct(token: string, id: string, input: UpdateProductInput): Promise<ProductDTO> {
  return request<ProductDTO>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function deleteProduct(token: string, id: string): Promise<void> {
  return request<void>(`/api/products/${id}`, { method: "DELETE" }, token);
}

export function listQuotations(token: string, customerId?: string): Promise<QuotationDTO[]> {
  const qs = customerId ? `?customerId=${customerId}` : "";
  return request<QuotationDTO[]>(`/api/quotations${qs}`, {}, token);
}

export function getQuotation(token: string, id: string): Promise<QuotationDTO> {
  return request<QuotationDTO>(`/api/quotations/${id}`, {}, token);
}

export function createQuotation(token: string, input: CreateQuotationInput): Promise<QuotationDTO> {
  return request<QuotationDTO>("/api/quotations", { method: "POST", body: JSON.stringify(input) }, token);
}

export async function getQuotationPdfBlob(token: string, id: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/quotations/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(res.status, "Could not load PDF");
  return res.blob();
}

export function sendQuotationWhatsApp(token: string, id: string): Promise<{ pdfUrl: string }> {
  return request<{ pdfUrl: string }>(`/api/quotations/${id}/send-whatsapp`, { method: "POST" }, token);
}

export function sendWhatsAppMessage(token: string, customerId: string, body: string): Promise<WhatsAppMessageDTO> {
  return request<WhatsAppMessageDTO>(`/api/whatsapp/customers/${customerId}/send`, { method: "POST", body: JSON.stringify({ body }) }, token);
}

export function simulateInboundWhatsApp(
  token: string,
  customerId: string,
  body: string
): Promise<{ inbound: WhatsAppMessageDTO; outbound: WhatsAppMessageDTO[] }> {
  return request(`/api/whatsapp/customers/${customerId}/simulate-inbound`, { method: "POST", body: JSON.stringify({ body }) }, token);
}

export function aiSuggestReply(token: string, customerId: string): Promise<AISuggestReplyResponse> {
  return request(`/api/ai/customers/${customerId}/suggest-reply`, { method: "POST" }, token);
}

export function aiSummarize(token: string, customerId: string): Promise<AISummarizeResponse> {
  return request(`/api/ai/customers/${customerId}/summarize`, { method: "POST" }, token);
}

export function aiSentiment(token: string, customerId: string): Promise<AISentimentResponse> {
  return request(`/api/ai/customers/${customerId}/sentiment`, { method: "POST" }, token);
}

export function aiNextBestAction(token: string, customerId: string): Promise<AINextBestActionResponse> {
  return request(`/api/ai/customers/${customerId}/next-best-action`, { method: "POST" }, token);
}

export function aiTranslate(token: string, text: string, targetLanguage: "en" | "ta" | "hi"): Promise<AITranslateResponse> {
  return request(`/api/ai/translate`, { method: "POST", body: JSON.stringify({ text, targetLanguage }) }, token);
}

export function isAiNotConfigured(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}

export function listNotifications(token: string): Promise<NotificationDTO[]> {
  return request<NotificationDTO[]>("/api/notifications", {}, token);
}

export function markNotificationRead(token: string, id: string): Promise<void> {
  return request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }, token);
}

export function markAllNotificationsRead(token: string): Promise<void> {
  return request<void>("/api/notifications/read-all", { method: "PATCH" }, token);
}

export function getReportSummary(token: string, from: string, to: string): Promise<ReportSummaryDTO> {
  return request<ReportSummaryDTO>(`/api/reports/summary?from=${from}&to=${to}`, {}, token);
}

async function fetchBlob(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiError(res.status, "Could not export report");
  return res.blob();
}

export function exportReportPdf(token: string, from: string, to: string): Promise<Blob> {
  return fetchBlob(`/api/reports/export.pdf?from=${from}&to=${to}`, token);
}

export function exportReportExcel(token: string, from: string, to: string): Promise<Blob> {
  return fetchBlob(`/api/reports/export.xlsx?from=${from}&to=${to}`, token);
}

export function exportReportCsv(token: string, from: string, to: string): Promise<Blob> {
  return fetchBlob(`/api/reports/export.csv?from=${from}&to=${to}`, token);
}

export function listEmployees(token: string): Promise<AdminUserDTO[]> {
  return request<AdminUserDTO[]>("/api/admin/employees", {}, token);
}

export function createEmployee(token: string, input: CreateEmployeeInput): Promise<AdminUserDTO> {
  return request<AdminUserDTO>("/api/admin/employees", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateEmployee(token: string, id: string, input: UpdateEmployeeInput): Promise<AdminUserDTO> {
  return request<AdminUserDTO>(`/api/admin/employees/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function deleteEmployee(token: string, id: string): Promise<void> {
  return request<void>(`/api/admin/employees/${id}`, { method: "DELETE" }, token);
}

export function getSystemLogs(token: string): Promise<SystemLogDTO[]> {
  return request<SystemLogDTO[]>("/api/admin/system-logs", {}, token);
}

export function getAutomationStatus(token: string): Promise<AutomationStatusDTO> {
  return request<AutomationStatusDTO>("/api/admin/automation-status", {}, token);
}

export function listWhatsAppTemplates(token: string): Promise<WhatsAppTemplateDTO[]> {
  return request<WhatsAppTemplateDTO[]>("/api/whatsapp-templates", {}, token);
}

export function createWhatsAppTemplate(token: string, input: CreateWhatsAppTemplateInput): Promise<WhatsAppTemplateDTO> {
  return request<WhatsAppTemplateDTO>("/api/whatsapp-templates", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateWhatsAppTemplate(token: string, id: string, input: Partial<CreateWhatsAppTemplateInput>): Promise<WhatsAppTemplateDTO> {
  return request<WhatsAppTemplateDTO>(`/api/whatsapp-templates/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function deleteWhatsAppTemplate(token: string, id: string): Promise<void> {
  return request<void>(`/api/whatsapp-templates/${id}`, { method: "DELETE" }, token);
}

// ---- Evidence, timeline, calls ----

export function getCustomerTimeline(token: string, customerId: string): Promise<CustomerTimelineEntryDTO[]> {
  return request<CustomerTimelineEntryDTO[]>(`/api/customers/${customerId}/timeline`, {}, token);
}

export function listCalls(token: string, customerId: string): Promise<CallDTO[]> {
  return request<CallDTO[]>(`/api/customers/${customerId}/calls`, {}, token);
}

export function logCall(token: string, customerId: string, input: Omit<CreateCallInput, "customerId">): Promise<CallDTO> {
  return request<CallDTO>(`/api/customers/${customerId}/calls`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function editNote(token: string, customerId: string, noteId: string, body: string): Promise<NoteDTO> {
  return request<NoteDTO>(`/api/customers/${customerId}/notes/${noteId}`, { method: "PATCH", body: JSON.stringify({ body }) }, token);
}

// ---- Lead assignment history & uncontacted alerts ----

export function getLeadAssignmentHistory(token: string, leadId: string): Promise<LeadAssignmentHistoryDTO[]> {
  return request<LeadAssignmentHistoryDTO[]>(`/api/leads/${leadId}/assignment-history`, {}, token);
}

export function getUncontactedLeadAlerts(token: string): Promise<UncontactedLeadAlertDTO[]> {
  return request<UncontactedLeadAlertDTO[]>("/api/leads/uncontacted-alerts", {}, token);
}

// ---- Productivity ----

export function getProductivitySummary(token: string, employeeId: string, range: ProductivityRange): Promise<ProductivitySummaryDTO> {
  return request<ProductivitySummaryDTO>(`/api/productivity/${employeeId}?range=${range}`, {}, token);
}

export function getProductivityDrilldown(
  token: string,
  employeeId: string,
  metric: ProductivityMetricKey,
  range: ProductivityRange
): Promise<ProductivityDrilldownRowDTO[]> {
  return request<ProductivityDrilldownRowDTO[]>(`/api/productivity/${employeeId}/drilldown?metric=${metric}&range=${range}`, {}, token);
}

// ---- Audit logs ----

export function listAuditLogs(token: string, filter: AuditLogFilter = {}): Promise<AuditLogPageDTO> {
  const query = new URLSearchParams();
  if (filter.userId) query.set("userId", filter.userId);
  if (filter.action) query.set("action", filter.action);
  if (filter.objectType) query.set("objectType", filter.objectType);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  if (filter.page) query.set("page", String(filter.page));
  if (filter.pageSize) query.set("pageSize", String(filter.pageSize));
  const qs = query.toString();
  return request<AuditLogPageDTO>(`/api/audit-logs${qs ? `?${qs}` : ""}`, {}, token);
}

export type { AuditLogDTO };

// ---- Categories & Catalogs ----

export function listCategories(token: string): Promise<CategoryDTO[]> {
  return request<CategoryDTO[]>("/api/categories", {}, token);
}

export function createCategory(token: string, input: CreateCategoryInput): Promise<CategoryDTO> {
  return request<CategoryDTO>("/api/categories", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateCategory(token: string, id: string, input: UpdateCategoryInput): Promise<CategoryDTO> {
  return request<CategoryDTO>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function deleteCategory(token: string, id: string): Promise<void> {
  return request<void>(`/api/categories/${id}`, { method: "DELETE" }, token);
}

export function listCatalogs(token: string): Promise<CatalogDTO[]> {
  return request<CatalogDTO[]>("/api/catalogs", {}, token);
}

export function createCatalog(token: string, input: CreateCatalogInput): Promise<CatalogDTO> {
  return request<CatalogDTO>("/api/catalogs", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateCatalog(token: string, id: string, input: UpdateCatalogInput): Promise<CatalogDTO> {
  return request<CatalogDTO>(`/api/catalogs/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function deleteCatalog(token: string, id: string): Promise<void> {
  return request<void>(`/api/catalogs/${id}`, { method: "DELETE" }, token);
}

// ---- Permissions ----

export function getEmployeePermissions(token: string, employeeId: string): Promise<EmployeePermissionsDTO> {
  return request<EmployeePermissionsDTO>(`/api/admin/employees/${employeeId}/permissions`, {}, token);
}

export function updateEmployeePermissions(
  token: string,
  employeeId: string,
  input: UpdateEmployeePermissionsInput
): Promise<EmployeePermissionsDTO> {
  return request<EmployeePermissionsDTO>(
    `/api/admin/employees/${employeeId}/permissions`,
    { method: "PATCH", body: JSON.stringify(input) },
    token
  );
}

// ---- Productivity score config ----

export function listScoreConfig(token: string): Promise<ProductivityScoreConfigDTO[]> {
  return request<ProductivityScoreConfigDTO[]>("/api/admin/score-config", {}, token);
}

export function updateScoreConfig(token: string, input: UpdateProductivityScoreConfigInput): Promise<ProductivityScoreConfigDTO[]> {
  return request<ProductivityScoreConfigDTO[]>("/api/admin/score-config", { method: "PATCH", body: JSON.stringify(input) }, token);
}

// ---- Additional report exports ----

export function exportEvidenceReportCsv(token: string, from: string, to: string): Promise<Blob> {
  return fetchBlob(`/api/reports/evidence.csv?from=${from}&to=${to}`, token);
}

export function exportAuditLogCsv(token: string, from: string, to: string): Promise<Blob> {
  return fetchBlob(`/api/reports/audit-log.csv?from=${from}&to=${to}`, token);
}

export function logout(token: string): Promise<void> {
  return request<void>("/api/auth/logout", { method: "POST" }, token);
}

export function listDuplicateAttempts(token: string): Promise<CustomerDuplicateAttemptDTO[]> {
  return request<CustomerDuplicateAttemptDTO[]>("/api/admin/duplicate-attempts", {}, token);
}
