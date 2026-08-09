"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusSelect } from "@/components/leads/status-select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCustomerDialog } from "@/components/leads/add-customer-dialog";
import { AssignmentHistoryDialog } from "@/components/leads/assignment-history-dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { LEAD_STATUS_LABELS, LeadStatus, type LeadDTO, type UncontactedLeadAlertDTO, type UserRefDTO } from "@indiamart-crm/shared";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "customerName:asc", label: "Customer name (A–Z)" },
  { value: "status:asc", label: "Status" },
];

export default function LeadsPage() {
  const { token, user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  const [leads, setLeads] = React.useState<LeadDTO[]>([]);
  const [users, setUsers] = React.useState<UserRefDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("ALL");
  const [sort, setSort] = React.useState("createdAt:desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkStatus, setBulkStatus] = React.useState<string>("");
  const [bulkAssignee, setBulkAssignee] = React.useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = React.useState(false);
  const [uncontactedAlerts, setUncontactedAlerts] = React.useState<UncontactedLeadAlertDTO[]>([]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLeads = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const [sortBy, sortDir] = sort.split(":") as [api.ListLeadsParams["sortBy"], api.ListLeadsParams["sortDir"]];
    try {
      const data = await api.listLeads(token, {
        q: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : [statusFilter as LeadStatus],
        assignedToId: assigneeFilter === "ALL" ? undefined : assigneeFilter,
        sortBy,
        sortDir,
      });
      setLeads(data);
      setSelected(new Set());
    } catch {
      setError("Could not load leads.");
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, statusFilter, assigneeFilter, sort]);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  React.useEffect(() => {
    if (!token || !canManage) return;
    api.listUsers(token).then(setUsers).catch(() => {});
  }, [token, canManage]);

  React.useEffect(() => {
    if (!token) return;
    api.getUncontactedLeadAlerts(token).then(setUncontactedAlerts).catch(() => {});
  }, [token, leads]);

  const uncontactedLeadIds = React.useMemo(() => new Set(uncontactedAlerts.map((a) => a.lead.id)), [uncontactedAlerts]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    if (!token) return;
    const previous = leads;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      await api.updateLead(token, leadId, { status });
    } catch (err) {
      setLeads(previous);
      setError(err instanceof api.ApiError ? err.message : "Could not update status.");
    }
  }

  async function handleBulkApply() {
    if (!token || selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const requested = selected.size;
      const { updated } = await api.bulkUpdateLeads(token, {
        ids: Array.from(selected),
        status: bulkStatus ? (bulkStatus as LeadStatus) : undefined,
        assignedToId: bulkAssignee || undefined,
      });
      if (updated < requested) {
        setError(
          `${updated} of ${requested} leads updated. The rest were skipped — e.g. a status of "Quotation Sent" requires an actual quotation to have been sent first.`
        );
      } else {
        setError(null);
      }
      setBulkStatus("");
      setBulkAssignee("");
      await fetchLeads();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Bulk update failed.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and manage IndiaMART leads</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      {uncontactedAlerts.length > 0 && (
        <Card className="flex items-center gap-2 border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {uncontactedAlerts.length} lead{uncontactedAlerts.length === 1 ? "" : "s"} not contacted for over the alert threshold —{" "}
          {uncontactedAlerts
            .slice(0, 3)
            .map((a) => a.lead.customer.name)
            .join(", ")}
          {uncontactedAlerts.length > 3 ? ` and ${uncontactedAlerts.length - 3} more` : ""}.
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, phone, company, product" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.values(LeadStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Assigned to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Everyone</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-accent/40 p-2.5">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Set status..." />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LeadStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" onClick={handleBulkApply} disabled={bulkSubmitting || (!bulkStatus && !bulkAssignee)}>
              {bulkSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}
      </Card>

      <Card>
        {error && <p className="p-4 text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No leads match your filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selected.size === leads.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className={uncontactedLeadIds.has(lead.id) ? "bg-amber-500/5" : undefined}>
                  <TableCell>
                    <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelected(lead.id)} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/customers/${lead.customer.id}`} className="font-medium hover:underline">
                      {lead.customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{lead.customer.phone}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.customer.company ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.productInterested ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusSelect value={lead.status} onChange={(status) => handleStatusChange(lead.id, status)} />
                      {uncontactedLeadIds.has(lead.id) && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.assignedTo?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <AssignmentHistoryDialog leadId={lead.id} customerName={lead.customer.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onCreated={fetchLeads} />
    </div>
  );
}
