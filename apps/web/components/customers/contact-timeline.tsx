"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/evidence/verified-badge";
import { LogCallDialog } from "@/components/customers/log-call-dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { CustomerTimelineEntryDTO } from "@indiamart-crm/shared";

export function ContactTimeline({ customerId }: { customerId: string }) {
  const { token } = useAuth();
  const [entries, setEntries] = React.useState<CustomerTimelineEntryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTimeline = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getCustomerTimeline(token, customerId);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [token, customerId]);

  React.useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LogCallDialog customerId={customerId} onLogged={fetchTimeline} />
      </div>
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ol className="relative space-y-5 border-l pl-5">
              {entries.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium capitalize">{entry.label}</p>
                    <VerifiedBadge status={entry.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.occurredAt).toLocaleString()}
                    {entry.user ? ` · ${entry.user.name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
