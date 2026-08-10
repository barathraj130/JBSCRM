"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { LEAD_STATUS_LABELS, type CustomerListItemDTO, type UserRefDTO } from "@indiamart-crm/shared";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "updatedAt:desc", label: "Recently updated" },
];

export default function CustomersPage() {
  const { token, user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  const [customers, setCustomers] = React.useState<CustomerListItemDTO[]>([]);
  const [users, setUsers] = React.useState<UserRefDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("ALL");
  const [sort, setSort] = React.useState("createdAt:desc");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const [sortBy, sortDir] = sort.split(":") as [api.ListCustomersParams["sortBy"], api.ListCustomersParams["sortDir"]];
    try {
      const data = await api.listCustomers(token, {
        q: debouncedSearch || undefined,
        assignedToId: assigneeFilter === "ALL" ? undefined : assigneeFilter,
        sortBy,
        sortDir,
      });
      setCustomers(data);
    } catch {
      setError("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, assigneeFilter, sort]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  React.useEffect(() => {
    if (!token || !canManage) return;
    api.listUsers(token).then(setUsers).catch(() => {});
  }, [token, canManage]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">Search and browse every customer on file</p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, phone, company" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

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
      </Card>

      <Card>
        {error && <p className="p-4 text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No customers match your search.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Latest status</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.company ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.leadCount}</TableCell>
                  <TableCell>
                    {c.latestLeadStatus ? <Badge variant="secondary">{LEAD_STATUS_LABELS[c.latestLeadStatus]}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.assignedTo?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
