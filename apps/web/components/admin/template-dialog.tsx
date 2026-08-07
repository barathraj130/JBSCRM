"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { WhatsAppTemplateDTO } from "@indiamart-crm/shared";

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: WhatsAppTemplateDTO | null;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setBody(template?.body ?? "");
      setError(null);
    }
  }, [open, template]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (template) {
        await api.updateWhatsAppTemplate(token, template.id, { name, body });
      } else {
        await api.createWhatsAppTemplate(token, { name, body });
      }
      onOpenChange(false);
      onSaved();
    } catch {
      setError("Could not save template.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "Add template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome message" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Message</Label>
            <Textarea id="tpl-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {template ? "Save changes" : "Add template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
