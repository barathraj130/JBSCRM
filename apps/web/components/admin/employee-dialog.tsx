"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { Role } from "@indiamart-crm/shared";
import type { AdminUserDTO } from "@indiamart-crm/shared";
import { ROLE_LABELS } from "@/lib/role-labels";

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  employees,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: AdminUserDTO | null;
  employees: AdminUserDTO[];
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("EMPLOYEE");
  const [managerId, setManagerId] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(employee?.name ?? "");
      setEmail(employee?.email ?? "");
      setPassword("");
      setRole(employee?.role ?? "EMPLOYEE");
      setManagerId(employee?.managerId ?? "");
      setIsActive(employee?.isActive ?? true);
      setError(null);
    }
  }, [open, employee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      if (employee) {
        await api.updateEmployee(token, employee.id, {
          name,
          role,
          managerId: managerId || null,
          isActive,
        });
      } else {
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters.");
          setSubmitting(false);
          return;
        }
        await api.createEmployee(token, { name, email, password, role, managerId: managerId || undefined });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Could not save employee.");
    } finally {
      setSubmitting(false);
    }
  }

  const managerOptions = employees.filter((e) => e.role !== "EMPLOYEE" && e.id !== employee?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-name">Name</Label>
            <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-email">Email</Label>
            <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!employee} required />
          </div>
          {!employee && (
            <div className="space-y-1.5">
              <Label htmlFor="emp-password">Password</Label>
              <Input id="emp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Manager</Label>
              <Select value={managerId || "NONE"} onValueChange={(v) => setManagerId(v === "NONE" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {managerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {employee && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {employee ? "Save changes" : "Add employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
