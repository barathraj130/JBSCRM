"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock, FilePlus2, Loader2, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusSelect } from "@/components/leads/status-select";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { WhatsAppPanel } from "@/components/customers/whatsapp-panel";
import { AIPanel } from "@/components/customers/ai-panel";
import { ContactTimeline } from "@/components/customers/contact-timeline";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { CustomerDetailDTO, LeadStatus, QuotationDTO, QuotationStatus } from "@indiamart-crm/shared";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_VARIANT: Record<QuotationStatus, "secondary" | "default" | "outline" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  VIEWED: "outline",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [customer, setCustomer] = React.useState<CustomerDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const [noteBody, setNoteBody] = React.useState("");
  const [noteSubmitting, setNoteSubmitting] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = React.useState("");
  const [noteEditSubmitting, setNoteEditSubmitting] = React.useState(false);

  const [followUpLeadId, setFollowUpLeadId] = React.useState("");
  const [followUpDue, setFollowUpDue] = React.useState("");
  const [followUpNotes, setFollowUpNotes] = React.useState("");
  const [followUpSubmitting, setFollowUpSubmitting] = React.useState(false);

  const [quotations, setQuotations] = React.useState<QuotationDTO[]>([]);
  const [quotationsLoading, setQuotationsLoading] = React.useState(true);

  const fetchCustomer = React.useCallback(async () => {
    if (!token || !params.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCustomer(token, params.id);
      setCustomer(data);
      if (!followUpLeadId && data.leads[0]) setFollowUpLeadId(data.leads[0].id);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Could not load customer.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  React.useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  React.useEffect(() => {
    if (!token || !params.id) return;
    setQuotationsLoading(true);
    api
      .listQuotations(token, params.id)
      .then(setQuotations)
      .finally(() => setQuotationsLoading(false));
  }, [token, params.id]);

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    if (!token || !customer) return;
    const previous = customer;
    setCustomer({ ...customer, leads: customer.leads.map((l) => (l.id === leadId ? { ...l, status } : l)) });
    try {
      await api.updateLead(token, leadId, { status });
    } catch (err) {
      setCustomer(previous);
      setError(err instanceof api.ApiError ? err.message : "Could not update status.");
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !customer || !noteBody.trim()) return;
    setNoteSubmitting(true);
    try {
      const note = await api.addNote(token, customer.id, noteBody.trim());
      setCustomer({ ...customer, notes: [note, ...customer.notes] });
      setNoteBody("");
    } catch {
      setError("Could not add note.");
    } finally {
      setNoteSubmitting(false);
    }
  }

  function startEditNote(id: string, body: string) {
    setEditingNoteId(id);
    setEditingNoteBody(body);
  }

  async function handleSaveNoteEdit(noteId: string) {
    if (!token || !customer || !editingNoteBody.trim()) return;
    setNoteEditSubmitting(true);
    try {
      const newNote = await api.editNote(token, customer.id, noteId, editingNoteBody.trim());
      setCustomer({ ...customer, notes: [newNote, ...customer.notes.filter((n) => n.id !== noteId)] });
      setEditingNoteId(null);
      setEditingNoteBody("");
    } catch {
      setError("Could not save the edited note.");
    } finally {
      setNoteEditSubmitting(false);
    }
  }

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !customer || !followUpLeadId || !followUpDue) return;
    setFollowUpSubmitting(true);
    try {
      const followUp = await api.createFollowUp(token, {
        leadId: followUpLeadId,
        dueAt: new Date(followUpDue).toISOString(),
        notes: followUpNotes || undefined,
      });
      setCustomer({ ...customer, followUps: [...customer.followUps, followUp].sort((a, b) => a.dueAt.localeCompare(b.dueAt)) });
      setFollowUpNotes("");
      setFollowUpDue("");
    } catch {
      setError("Could not schedule follow-up.");
    } finally {
      setFollowUpSubmitting(false);
    }
  }

  async function handleCompleteFollowUp(id: string) {
    if (!token || !customer) return;
    try {
      const updated = await api.completeFollowUp(token, id);
      setCustomer({ ...customer, followUps: customer.followUps.map((f) => (f.id === id ? updated : f)) });
    } catch {
      setError("Could not update follow-up.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Button>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!customer) return null;

  const productsInterested = Array.from(new Set(customer.leads.map((l) => l.productInterested).filter(Boolean))) as string[];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/leads")} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Button>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {initials(customer.name)}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{customer.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
                {customer.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {customer.company}
                  </span>
                )}
                {(customer.city || customer.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[customer.city, customer.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              {productsInterested.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {productsInterested.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {customer.leads.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No leads for this customer yet.</CardContent>
            </Card>
          ) : (
            customer.leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium">{lead.productInterested ?? "General inquiry"}</p>
                    <p className="text-xs text-muted-foreground">
                      Source: {lead.source} · Assigned to: {lead.assignedTo?.name ?? "Unassigned"} · Created{" "}
                      {new Date(lead.createdAt).toLocaleDateString()}
                      {lead.dealValue ? ` · ₹${lead.dealValue.toLocaleString("en-IN")}` : ""}
                    </p>
                  </div>
                  <StatusSelect value={lead.status} onChange={(status) => handleStatusChange(lead.id, status)} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <ContactTimeline customerId={customer.id} />
        </TabsContent>

        <TabsContent value="followups" className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleAddFollowUp} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label>Lead</Label>
                  <Select value={followUpLeadId} onValueChange={setFollowUpLeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {customer.leads.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.productInterested ?? "General inquiry"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="followup-due">Due</Label>
                  <Input id="followup-due" type="datetime-local" value={followUpDue} onChange={(e) => setFollowUpDue(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="followup-notes">Notes</Label>
                  <Input id="followup-notes" value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="What to follow up on" />
                </div>
                <Button type="submit" disabled={followUpSubmitting || !followUpLeadId || !followUpDue}>
                  {followUpSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Schedule
                </Button>
              </form>
            </CardContent>
          </Card>

          {customer.followUps.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No follow-ups scheduled.</CardContent>
            </Card>
          ) : (
            customer.followUps.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{new Date(f.dueAt).toLocaleString()}</p>
                      {f.notes && <p className="text-sm text-muted-foreground">{f.notes}</p>}
                      <p className="text-xs text-muted-foreground">Owner: {f.user?.name ?? "Removed employee"}</p>
                    </div>
                  </div>
                  {f.status === "PENDING" ? (
                    <Button size="sm" variant="outline" onClick={() => handleCompleteFollowUp(f.id)}>
                      Mark complete
                    </Button>
                  ) : (
                    <Badge variant="success">Completed</Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea placeholder="Add a note about this customer..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                <Button type="submit" size="sm" disabled={noteSubmitting || !noteBody.trim()}>
                  {noteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add note
                </Button>
              </form>
            </CardContent>
          </Card>

          {customer.notes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No notes yet.</CardContent>
            </Card>
          ) : (
            customer.notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="space-y-2 p-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <Textarea value={editingNoteBody} onChange={(e) => setEditingNoteBody(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveNoteEdit(note.id)} disabled={noteEditSubmitting || !editingNoteBody.trim()}>
                          {noteEditSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">{note.body}</p>
                        <button
                          onClick={() => startEditNote(note.id, note.body)}
                          className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {note.author?.name ?? "Removed employee"} · {new Date(note.createdAt).toLocaleString()}
                        {note.isEdited && " · edited"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="quotations" className="space-y-3">
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link href={`/quotations/new?customerId=${customer.id}`}>
                <FilePlus2 className="h-3.5 w-3.5" />
                New quotation
              </Link>
            </Button>
          </div>

          {quotationsLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : quotations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No quotations yet.</CardContent>
            </Card>
          ) : (
            quotations.map((q) => (
              <Link key={q.id} href={`/quotations/${q.id}`}>
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">₹{q.total.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.items.length} item{q.items.length === 1 ? "" : "s"} · {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppPanel customerId={customer.id} initialMessages={customer.whatsAppMessages} />
        </TabsContent>

        <TabsContent value="ai">
          <AIPanel customerId={customer.id} />
        </TabsContent>
      </Tabs>

      <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} onSaved={fetchCustomer} />
    </div>
  );
}
