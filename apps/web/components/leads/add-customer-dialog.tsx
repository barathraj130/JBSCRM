"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";

const emptyForm = { name: "", phone: "", company: "", city: "", state: "", productInterested: "", source: "Manual Entry", notes: "" };

export function AddCustomerDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { token } = useAuth();
  const router = useRouter();
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [duplicate, setDuplicate] = React.useState<{ customerId: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError(null);
      setDuplicate(null);
    }
  }, [open]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setDuplicate(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    setSubmitting(true);
    try {
      const lead = await api.createLead(token, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        company: form.company || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        productInterested: form.productInterested || undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
      });
      onOpenChange(false);
      onCreated();
      router.push(`/customers/${lead.customer.id}`);
    } catch (err) {
      if (err instanceof api.ApiError && err.code === "DUPLICATE_CUSTOMER" && err.customerId) {
        setDuplicate({ customerId: err.customerId });
      } else {
        setError(err instanceof api.ApiError ? err.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
        </DialogHeader>

        {duplicate ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive">Customer already exists.</p>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                router.push(`/customers/${duplicate.customerId}`);
              }}
            >
              Open existing customer profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product">Product</Label>
                <Input id="product" value={form.productInterested} onChange={(e) => update("productInterested", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Input id="source" value={form.source} onChange={(e) => update("source", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save customer
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
