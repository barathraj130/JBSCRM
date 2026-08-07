import { LEAD_STATUS_LABELS, type LeadStatus } from "@indiamart-crm/shared";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/status-styles";

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status], className)}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
