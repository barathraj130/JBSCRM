import { LEAD_STATUS_LABELS, type ActivityLogDTO, type LeadStatus } from "@indiamart-crm/shared";

export function formatActivity(log: ActivityLogDTO): string {
  const meta = log.metadata ?? {};
  switch (log.action) {
    case "lead_created":
      return "created this lead";
    case "status_changed":
      return `changed status from ${LEAD_STATUS_LABELS[meta.from as LeadStatus] ?? meta.from} to ${LEAD_STATUS_LABELS[meta.to as LeadStatus] ?? meta.to}`;
    case "reassigned":
      return "reassigned this lead";
    case "bulk_update":
      return "updated this lead via a bulk action";
    case "follow_up_scheduled":
      return "scheduled a follow-up";
    case "follow_up_completed":
      return "completed a follow-up";
    case "note_added":
      return "added a note";
    case "profile_updated":
      return "updated the customer profile";
    default:
      return log.action.replace(/_/g, " ");
  }
}
