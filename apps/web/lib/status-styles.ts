import type { LeadStatus } from "@indiamart-crm/shared";

export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CONTACTED: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  INTERESTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  FOLLOW_UP: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  QUOTATION_SENT: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  WON: "bg-success/10 text-success border-success/20",
  LOST: "bg-destructive/10 text-destructive border-destructive/20",
};
