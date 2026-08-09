"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from "@indiamart-crm/shared";
import type { AdminUserDTO, EmployeePermissionsDTO } from "@indiamart-crm/shared";

export function PermissionsDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: AdminUserDTO | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { token } = useAuth();
  const [data, setData] = React.useState<EmployeePermissionsDTO | null>(null);
  const [effective, setEffective] = React.useState<Set<PermissionKey>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && employee && token) {
      setLoading(true);
      api
        .getEmployeePermissions(token, employee.id)
        .then((res) => {
          setData(res);
          setEffective(new Set(res.effective));
        })
        .finally(() => setLoading(false));
    }
  }, [open, employee, token]);

  function toggle(key: PermissionKey) {
    setEffective((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (!token || !employee || !data) return;
    setSaving(true);
    try {
      const overrides = PERMISSION_KEYS.filter((key) => {
        const defaultGranted = data.defaults.includes(key);
        const nowGranted = effective.has(key);
        return defaultGranted !== nowGranted;
      }).map((key) => ({ key, granted: effective.has(key) }));
      await api.updateEmployeePermissions(token, employee.id, overrides);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissions — {employee.name}</DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="mb-2 text-xs text-muted-foreground">
              Defaults come from the &ldquo;{employee.role}&rdquo; role. Toggling a box here overrides the default just for this
              employee.
            </p>
            {PERMISSION_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent/50">
                <Checkbox checked={effective.has(key)} onCheckedChange={() => toggle(key)} />
                <span>{PERMISSION_LABELS[key]}</span>
                {data.defaults.includes(key) && <span className="text-[10px] text-muted-foreground">(default)</span>}
              </label>
            ))}
            <Button className="mt-3 w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save permissions
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
