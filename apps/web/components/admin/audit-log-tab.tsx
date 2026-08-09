"use client";

import * as React from "react";
import { AlertOctagon, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { AuditLogDTO, CustomerDuplicateAttemptDTO } from "@indiamart-crm/shared";

export function AuditLogTab() {
  const { token } = useAuth();
  const [logs, setLogs] = React.useState<AuditLogDTO[]>([]);
  const [total, setTotal] = React.useState(0);
  const [duplicates, setDuplicates] = React.useState<CustomerDuplicateAttemptDTO[]>([]);
  const [actionFilter, setActionFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const fetchLogs = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [page, dupes] = await Promise.all([
        api.listAuditLogs(token, { action: actionFilter || undefined, pageSize: 100 }),
        api.listDuplicateAttempts(token),
      ]);
      setLogs(page.items);
      setTotal(page.total);
      setDuplicates(dupes);
    } finally {
      setLoading(false);
    }
  }, [token, actionFilter]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-1.5 text-foreground">
            <ShieldAlert className="h-4 w-4" />
            Audit Log
          </CardTitle>
          <Input
            placeholder="Filter by action..."
            className="h-8 w-56 text-xs"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <>
              <div className="max-h-[28rem] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Object</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{log.actorName}</TableCell>
                        <TableCell className="text-sm">{log.action.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.objectType}
                          {log.objectId ? ` #${log.objectId.slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="border-t p-2 text-xs text-muted-foreground">
                Showing {logs.length} of {total} entries. This log is append-only — entries are never edited or deleted.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-foreground">
            <AlertOctagon className="h-4 w-4" />
            Duplicate customer attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {duplicates.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No duplicate creation attempts recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Attempted by</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm">{d.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.attemptedBy?.name ?? "Unknown"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
