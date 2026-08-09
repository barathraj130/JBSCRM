"use client";

import * as React from "react";
import { History, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { LeadAssignmentHistoryDTO } from "@indiamart-crm/shared";

export function AssignmentHistoryDialog({ leadId, customerName }: { leadId: string; customerName: string }) {
  const { token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<LeadAssignmentHistoryDTO[]>([]);

  function handleOpen() {
    setOpen(true);
    if (!token) return;
    setLoading(true);
    api
      .getLeadAssignmentHistory(token, leadId)
      .then(setHistory)
      .finally(() => setLoading(false));
  }

  return (
    <>
      <button onClick={handleOpen} className="text-muted-foreground hover:text-foreground" title="Assignment history">
        <History className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assignment history — {customerName}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignment history yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="text-muted-foreground">{h.fromUser?.name ?? "Unassigned"}</span> {"→ "}
                  <span className="font-medium">{h.toUser?.name ?? "Unassigned"}</span>
                  <p className="text-xs text-muted-foreground">
                    by {h.changedBy?.name ?? "System"} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
