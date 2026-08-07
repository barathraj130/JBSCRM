"use client";

import * as React from "react";
import { AlertTriangle, Languages, Lightbulb, Loader2, MessageCircleHeart, Smile, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { AISentiment } from "@indiamart-crm/shared";

const SENTIMENT_STYLE: Record<AISentiment, string> = {
  positive: "text-success",
  neutral: "text-muted-foreground",
  negative: "text-destructive",
};

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onRun,
  result,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  onRun: () => Promise<void>;
  result: React.ReactNode;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await onRun();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {buttonLabel}
        </Button>
        {result}
      </CardContent>
    </Card>
  );
}

export function AIPanel({ customerId }: { customerId: string }) {
  const { token } = useAuth();
  const [unavailable, setUnavailable] = React.useState(false);
  const [reply, setReply] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [sentiment, setSentiment] = React.useState<AISentiment | null>(null);
  const [action, setAction] = React.useState<string | null>(null);

  const [translateText, setTranslateText] = React.useState("");
  const [targetLanguage, setTargetLanguage] = React.useState<"en" | "ta" | "hi">("ta");
  const [translated, setTranslated] = React.useState<string | null>(null);
  const [translating, setTranslating] = React.useState(false);

  function guard<T>(fn: () => Promise<T>): () => Promise<void> {
    return async () => {
      try {
        await fn();
      } catch (err) {
        if (api.isAiNotConfigured(err)) setUnavailable(true);
      }
    };
  }

  async function handleTranslate() {
    if (!token || !translateText.trim()) return;
    setTranslating(true);
    try {
      const res = await api.aiTranslate(token, translateText.trim(), targetLanguage);
      setTranslated(res.translated);
    } catch (err) {
      if (api.isAiNotConfigured(err)) setUnavailable(true);
    } finally {
      setTranslating(false);
    }
  }

  if (unavailable) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">AI features aren&apos;t configured yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add <code className="rounded bg-muted px-1 py-0.5 text-xs">ANTHROPIC_API_KEY</code> to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">apps/api/.env</code> and restart the API to enable reply
              suggestions, summaries, sentiment detection, next-best-action, and translation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ActionCard
        icon={MessageCircleHeart}
        title="Suggest reply"
        description="Draft the next reply based on the WhatsApp conversation so far."
        buttonLabel="Suggest a reply"
        onRun={guard(async () => {
          if (!token) return;
          const res = await api.aiSuggestReply(token, customerId);
          setReply(res.reply);
        })}
        result={reply && <p className="rounded-md bg-muted p-2 text-sm">{reply}</p>}
      />

      <ActionCard
        icon={Sparkles}
        title="Summarize conversation"
        description="Get a short summary of the WhatsApp thread with this customer."
        buttonLabel="Summarize"
        onRun={guard(async () => {
          if (!token) return;
          const res = await api.aiSummarize(token, customerId);
          setSummary(res.summary);
        })}
        result={summary && <p className="rounded-md bg-muted p-2 text-sm">{summary}</p>}
      />

      <ActionCard
        icon={Smile}
        title="Detect sentiment"
        description="Gauge how the customer is feeling based on the conversation."
        buttonLabel="Detect sentiment"
        onRun={guard(async () => {
          if (!token) return;
          const res = await api.aiSentiment(token, customerId);
          setSentiment(res.sentiment);
        })}
        result={
          sentiment && <p className={`text-sm font-medium capitalize ${SENTIMENT_STYLE[sentiment]}`}>{sentiment}</p>
        }
      />

      <ActionCard
        icon={Lightbulb}
        title="Next best action"
        description="Get a recommendation for what to do next with this lead."
        buttonLabel="Suggest next action"
        onRun={guard(async () => {
          if (!token) return;
          const res = await api.aiNextBestAction(token, customerId);
          setAction(res.action);
        })}
        result={action && <p className="rounded-md bg-muted p-2 text-sm">{action}</p>}
      />

      <Card className="sm:col-span-2">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Translate</p>
          </div>
          <Textarea placeholder="Enter text to translate..." value={translateText} onChange={(e) => setTranslateText(e.target.value)} />
          <div className="flex items-center gap-2">
            <Select value={targetLanguage} onValueChange={(v) => setTargetLanguage(v as typeof targetLanguage)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handleTranslate} disabled={translating || !translateText.trim()}>
              {translating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Translate
            </Button>
          </div>
          {translated && <p className="rounded-md bg-muted p-2 text-sm">{translated}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
