"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { ProductivityScoreConfigDTO } from "@indiamart-crm/shared";

export function ScoreConfigTab() {
  const { token } = useAuth();
  const [config, setConfig] = React.useState<ProductivityScoreConfigDTO[]>([]);
  const [points, setPoints] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .listScoreConfig(token)
      .then((data) => {
        setConfig(data);
        setPoints(Object.fromEntries(data.map((c) => [c.key, String(c.points)])));
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      const input = config.map((c) => ({ key: c.key, points: Number(points[c.key] ?? c.points) }));
      const updated = await api.updateScoreConfig(token, input);
      setConfig(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Point values used to compute each employee&rsquo;s productivity score from verified evidence. Sending large volumes of
          meaningless messages doesn&rsquo;t help — scoring only counts verified activity types below.
        </p>
        {config.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
            <span className="text-sm">{c.label}</span>
            <Input
              type="number"
              className="w-24"
              value={points[c.key] ?? ""}
              onChange={(e) => setPoints((p) => ({ ...p, [c.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
