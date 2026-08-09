"use client";

import * as React from "react";
import { Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { CallDirection } from "@indiamart-crm/shared";

function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function LogCallDialog({ customerId, onLogged }: { customerId: string; onLogged: () => void }) {
  const { token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [direction, setDirection] = React.useState<"INCOMING" | "OUTGOING">(CallDirection.OUTGOING);
  const [startedAt, setStartedAt] = React.useState(nowLocal());
  const [durationMinutes, setDurationMinutes] = React.useState("");
  const [status, setStatus] = React.useState("Completed");
  const [outcome, setOutcome] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.logCall(token, customerId, {
        direction,
        startedAt: new Date(startedAt).toISOString(),
        durationSeconds: durationMinutes ? Number(durationMinutes) * 60 : undefined,
        status,
        outcome: outcome || undefined,
      });
      setOpen(false);
      setOutcome("");
      setDurationMinutes("");
      onLogged();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Could not log call.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PhoneCall className="h-3.5 w-3.5" />
        Log a call
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a call</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-xs text-muted-foreground">
            No telephony integration is connected, so this is recorded as a self-reported activity — not equivalent to a verified
            WhatsApp send or catalog delivery.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as "INCOMING" | "OUTGOING")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CallDirection.OUTGOING}>Outgoing</SelectItem>
                    <SelectItem value={CallDirection.INCOMING}>Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="call-started">When</Label>
                <Input id="call-started" type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="call-duration">Duration (minutes)</Label>
                <Input
                  id="call-duration"
                  type="number"
                  min={0}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="call-status">Status</Label>
                <Input id="call-status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Completed, No answer..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-outcome">Outcome</Label>
              <Input id="call-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What happened on the call" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save call
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
