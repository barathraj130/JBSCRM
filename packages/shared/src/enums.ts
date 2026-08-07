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
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
