import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EvidenceStatus } from "@indiamart-crm/shared";

export function VerifiedBadge({ status, className }: { status: EvidenceStatus | null; className?: string }) {
  if (status === null) return null;

  if (status === "VERIFIED") {
    return (
      <Badge variant="success" className={cn("gap-1", className)}>
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400", className)}>
      <AlertTriangle className="h-3 w-3" />
      Self-reported
    </Badge>
  );
}
