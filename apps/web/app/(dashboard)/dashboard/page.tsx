"use client";

import * as React from "react";
import { Loader2, Users, UserPlus, Clock, Trophy, XCircle, IndianRupee, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { LEAD_STATUS_LABELS, type DashboardSummaryDTO } from "@indiamart-crm/shared";

const STAT_CARDS: {
  key: keyof DashboardSummaryDTO;
  label: string;
  icon: React.ElementType;
  format?: (v: number) => string;
}[] = [
  { key: "totalLeads", label: "Total Leads", icon: Users },
  { key: "newLeadsToday", label: "New Leads Today", icon: UserPlus },
  { key: "pendingFollowUps", label: "Pending Follow-ups", icon: Clock },
  { key: "closedDeals", label: "Closed Deals", icon: Trophy },
  { key: "lostDeals", label: "Lost Deals", icon: XCircle },
  { key: "revenue", label: "Revenue", icon: IndianRupee, format: (v) => `₹${v.toLocaleString("en-IN")}` },
  { key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, format: (v) => `${v}%` },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = React.useState<DashboardSummaryDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    api
      .getDashboardSummary(token)
      .then(setSummary)
      .catch(() => setError("Could not load dashboard data."));
  }, [token]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusData = Object.entries(summary.leadsByStatus).map(([status, count]) => ({
    status: LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS],
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of lead activity and performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, format }) => {
          const value = summary[key] as number;
          return (
            <Card key={key} className="animate-in fade-in-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{format ? format(value) : value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Leads — last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.dailyLeadTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Leads by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
