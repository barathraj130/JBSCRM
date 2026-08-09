export const Role = {
  ADMIN: "ADMIN",
  SALES_MANAGER: "SALES_MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED",
  FOLLOW_UP: "FOLLOW_UP",
  QUOTATION_SENT: "QUOTATION_SENT",
  WON: "WON",
  LOST: "LOST",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow-up",
  QUOTATION_SENT: "Quotation Sent",
  WON: "Won",
  LOST: "Lost",
};

export const FollowUpStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus];

export const QuotationStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  VIEWED: "VIEWED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const WhatsAppDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type WhatsAppDirection = (typeof WhatsAppDirection)[keyof typeof WhatsAppDirection];

export const NotificationType = {
  NEW_LEAD: "NEW_LEAD",
  FOLLOW_UP_REMINDER: "FOLLOW_UP_REMINDER",
  CUSTOMER_REPLY: "CUSTOMER_REPLY",
  DEAL_WON: "DEAL_WON",
  DEAL_LOST: "DEAL_LOST",
  UNCONTACTED_LEAD_ALERT: "UNCONTACTED_LEAD_ALERT",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const EvidenceType = {
  LEAD_IMPORTED: "LEAD_IMPORTED",
  LEAD_ASSIGNED: "LEAD_ASSIGNED",
  LEAD_REASSIGNED: "LEAD_REASSIGNED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  WHATSAPP_MESSAGE_SENT: "WHATSAPP_MESSAGE_SENT",
  WHATSAPP_MESSAGE_RECEIVED: "WHATSAPP_MESSAGE_RECEIVED",
  CATALOG_SENT: "CATALOG_SENT",
  CALL_LOGGED: "CALL_LOGGED",
  QUOTATION_CREATED: "QUOTATION_CREATED",
  QUOTATION_SENT: "QUOTATION_SENT",
  FOLLOW_UP_SCHEDULED: "FOLLOW_UP_SCHEDULED",
  FOLLOW_UP_COMPLETED: "FOLLOW_UP_COMPLETED",
  NOTE_ADDED: "NOTE_ADDED",
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  DEAL_WON: "DEAL_WON",
} as const;
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  LEAD_IMPORTED: "Lead imported",
  LEAD_ASSIGNED: "Lead assigned",
  LEAD_REASSIGNED: "Lead reassigned",
  LEAD_STATUS_CHANGED: "Status changed",
  WHATSAPP_MESSAGE_SENT: "WhatsApp message sent",
  WHATSAPP_MESSAGE_RECEIVED: "WhatsApp message received",
  CATALOG_SENT: "Catalog sent",
  CALL_LOGGED: "Call logged",
  QUOTATION_CREATED: "Quotation created",
  QUOTATION_SENT: "Quotation sent",
  FOLLOW_UP_SCHEDULED: "Follow-up scheduled",
  FOLLOW_UP_COMPLETED: "Follow-up completed",
  NOTE_ADDED: "Note added",
  CUSTOMER_CREATED: "Customer created",
  DEAL_WON: "Deal won",
};

export const EvidenceStatus = {
  VERIFIED: "VERIFIED",
  SELF_REPORTED: "SELF_REPORTED",
} as const;
export type EvidenceStatus = (typeof EvidenceStatus)[keyof typeof EvidenceStatus];

export const CallDirection = {
  INCOMING: "INCOMING",
  OUTGOING: "OUTGOING",
} as const;
export type CallDirection = (typeof CallDirection)[keyof typeof CallDirection];

export const CUSTOMER_SOURCES = [
  "IndiaMART",
  "WhatsApp",
  "Phone",
  "Walk-in",
  "Referral",
  "Website",
  "Existing Customer",
  "Other",
] as const;
export type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

export const FOLLOW_UP_OUTCOMES = [
  "Customer interested",
  "Customer requested quotation",
  "Customer requested catalog",
  "Customer asked for callback",
  "Customer not interested",
  "No response",
  "Other",
] as const;
export type FollowUpOutcome = (typeof FOLLOW_UP_OUTCOMES)[number];
