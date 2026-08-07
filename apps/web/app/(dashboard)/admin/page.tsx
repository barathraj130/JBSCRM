"use client";

import * as React from "react";
import { CheckCircle2, History, Loader2, MessageSquareText, Pencil, Plus, Trash2, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeDialog } from "@/components/admin/employee-dialog";
import { TemplateDialog } from "@/components/admin/template-dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { AdminUserDTO, AutomationStatusDTO, SystemLogDTO, WhatsAppTemplateDTO } from "@indiamart-crm/shared";

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {ok ? (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Configured
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <XCircle className="h-3 w-3" />
          Not set
        </Badge>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { token } = useAuth();

  const [employees, setEmployees] = React.useState<AdminUserDTO[]>([]);
  const [employeesLoading, setEmployeesLoading] = React.useState(true);
  const [employeeDialogOpen, setEmployeeDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<AdminUserDTO | null>(null);

  const [templates, setTemplates] = React.useState<WhatsAppTemplateDTO[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<WhatsAppTemplateDTO | null>(null);

  const [status, setStatus] = React.useState<AutomationStatusDTO | null>(null);

  const [logs, setLogs] = React.useState<SystemLogDTO[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(true);

  const fetchEmployees = React.useCallback(() => {
    if (!token) return;
    setEmployeesLoading(true);
    api.listEmployees(token).then(setEmployees).finally(() => setEmployeesLoading(false));
  }, [token]);

  const fetchTemplates = React.useCallback(() => {
    if (!token) return;
    setTemplatesLoading(true);
    api.listWhatsAppTemplates(token).then(setTemplates).finally(() => setTemplatesLoading(false));
  }, [token]);

  React.useEffect(() => {
    fetchEmployees();
    fetchTemplates();
    if (token) {
      api.getAutomationStatus(token).then(setStatus);
      api.getSystemLogs(token).then(setLogs).finally(() => setLogsLoading(false));
    }
  }, [token, fetchEmployees, fetchTemplates]);

  async function handleDeleteTemplate(id: string) {
    if (!token || !window.confirm("Delete this template?")) return;
    await api.deleteWhatsAppTemplate(token, id);
    fetchTemplates();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage employees, WhatsApp templates, automation, and system logs</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="templates">WhatsApp Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation Status</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingEmployee(null);
                setEmployeeDialogOpen(true);
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add employee
            </Button>
          </div>
          <Card>
            {employeesLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ROLE_LABELS[emp.role]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.managerName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={emp.isActive ? "success" : "outline"}>{emp.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEmployeeDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setTemplateDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add template
            </Button>
          </div>
          {templatesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No templates yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium">{t.name}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            setEditingTemplate(t);
                            setTemplateDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-xs text-muted-foreground">{t.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardContent className="p-4">
              {!status ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <StatusRow
                    label="WhatsApp provider"
                    ok={status.whatsappProvider !== "mock"}
                    detail={
                      status.whatsappProvider === "mock"
                        ? "Using the mock provider — messages are logged, not actually delivered. Set WHATSAPP_PROVIDER and credentials in apps/api/.env for a live account."
                        : `Live provider: ${status.whatsappProvider}`
                    }
                  />
                  <StatusRow
                    label="n8n webhook URL"
                    ok={status.n8nWebhookConfigured}
                    detail="Outbound notifications to your n8n workflow (N8N_WEBHOOK_URL)."
                  />
                  <StatusRow
                    label="n8n inbound API key"
                    ok={status.n8nApiKeyConfigured}
                    detail="Required for n8n to call /api/webhooks/whatsapp-inbound (N8N_API_KEY)."
                  />
                  <StatusRow
                    label="AI (Claude)"
                    ok={status.aiConfigured}
                    detail={status.aiConfigured ? `Model: ${status.aiModel}` : "Set ANTHROPIC_API_KEY to enable AI features."}
                  />
                  <div className="pt-3 text-xs text-muted-foreground">Quotation letterhead: {status.companyName}</div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-4">
              {logsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
                  {logs.map((log) => (
                    <li key={log.id} className="flex gap-3 text-sm">
                      <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p>
                          <span className="font-medium">{log.user?.name ?? "System"}</span>{" "}
                          <span className="text-muted-foreground">
                            {log.action.replace(/_/g, " ")} · {log.entityType}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={editingEmployee}
        employees={employees}
        onSaved={fetchEmployees}
      />
      <TemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} template={editingTemplate} onSaved={fetchTemplates} />
    </div>
  );
}
