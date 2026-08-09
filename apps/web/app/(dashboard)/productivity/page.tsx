"use client";

import * as React from "react";
import { Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/evidence/verified-badge";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type {
  ProductivityDrilldownRowDTO,
  ProductivityMetricKey,
  ProductivityRange,
  ProductivitySummaryDTO,
  UserRefDTO,
} from "@indiamart-crm/shared";

interface MetricConfig {
  key: ProductivityMetricKey;
  label: string;
  drillable: boolean;
  format?: (value: number) => string;
}

const METRICS: MetricConfig[] = [
  { key: "leadsAssigned", label: "Leads Assigned", drillable: true },
  { key: "verifiedContacts", label: "Verified Contacts", drillable: true },
  { key: "whatsappConversations", label: "WhatsApp Conversations", drillable: true },
  { key: "catalogsSent", label: "Catalogs Sent", drillable: true },
  { key: "verifiedCalls", label: "Verified Calls", drillable: true },
  { key: "selfReportedCalls", label: "Self-Reported Calls", drillable: true },
  { key: "followUpsCompleted", label: "Follow-ups Completed", drillable: true },
  { key: "quotationsCreated", label: "Quotations Created", drillable: true },
  { key: "quotationsSent", label: "Quotations Sent", drillable: true },
  { key: "dealsWon", label: "Deals Won", drillable: true },
  { key: "revenue", label: "Revenue", drillable: false, format: (v) => `₹${v.toLocaleString("en-IN")}` },
  { key: "conversionRate", label: "Conversion Rate", drillable: false, format: (v) => `${v}%` },
  { key: "followUpCompletionRate", label: "Follow-up Completion", drillable: false, format: (v) => `${v}%` },
  { key: "score", label: "Productivity Score", drillable: false },
];

export default function ProductivityPage() {
  const { token, user } = useAuth();
  const canViewOthers = user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  const [employees, setEmployees] = React.useState<UserRefDTO[]>([]);
  const [employeeId, setEmployeeId] = React.useState<string>("");
  const [range, setRange] = React.useState<ProductivityRange>("daily");
  const [summary, setSummary] = React.useState<ProductivitySummaryDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedMetric, setSelectedMetric] = React.useState<ProductivityMetricKey | null>(null);
  const [drilldown, setDrilldown] = React.useState<ProductivityDrilldownRowDTO[]>([]);
  const [drilldownLoading, setDrilldownLoading] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    if (canViewOthers) {
      api.listUsers(token).then((users) => {
        setEmployees(users);
        setEmployeeId((current) => current || user?.id || users[0]?.id || "");
      });
    } else if (user) {
      setEmployeeId(user.id);
    }
  }, [token, canViewOthers, user]);

  const fetchSummary = React.useCallback(async () => {
    if (!token || !employeeId) return;
    setLoading(true);
    try {
      const data = await api.getProductivitySummary(token, employeeId, range);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [token, employeeId, range]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  async function handleMetricClick(metric: MetricConfig) {
    if (!metric.drillable || !token || !employeeId) return;
    setSelectedMetric(metric.key);
    setDrilldownLoading(true);
    try {
      const rows = await api.getProductivityDrilldown(token, employeeId, metric.key, range);
      setDrilldown(rows);
    } finally {
      setDrilldownLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Productivity</h1>
          <p className="text-sm text-muted-foreground">
            Verified evidence, not self-reported claims — every number here is traceable to a real customer interaction.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {canViewOthers && (
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Tabs value={range} onValueChange={(v) => setRange(v as ProductivityRange)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading || !summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {METRICS.map((metric) => {
              const value = summary.metrics[metric.key];
              const display = metric.format ? metric.format(value) : String(value);
              const active = selectedMetric === metric.key;
              return (
                <Card
                  key={metric.key}
                  className={metric.drillable ? "cursor-pointer transition-colors hover:border-primary" : undefined}
                  onClick={() => handleMetricClick(metric)}
                >
                  <CardContent className="p-4">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {metric.label}
                      {metric.drillable && <TrendingUp className="h-3 w-3" />}
                    </p>
                    <p className={`mt-1 text-xl font-semibold ${active ? "text-primary" : ""}`}>{display}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedMetric && (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b p-4">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Evidence behind &ldquo;{METRICS.find((m) => m.key === selectedMetric)?.label}&rdquo;
                  </p>
                </div>
                {drilldownLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : drilldown.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No evidence for this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead>Evidence</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drilldown.map((row, i) => (
                        <TableRow key={row.evidenceId ?? `${row.refId}-${i}`}>
                          <TableCell className="font-medium">
                            <a href={`/customers/${row.customer.id}`} className="hover:underline">
                              {row.customer.name}
                            </a>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.customer.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(row.occurredAt).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{row.summary}</TableCell>
                          <TableCell>
                            <VerifiedBadge status={row.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
