"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { WhatsAppMessageDTO } from "@indiamart-crm/shared";

export function WhatsAppPanel({ customerId, initialMessages }: { customerId: string; initialMessages: WhatsAppMessageDTO[] }) {
  const { token } = useAuth();
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [simDraft, setSimDraft] = React.useState("");
  const [simulating, setSimulating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const message = await api.sendWhatsAppMessage(token, customerId, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft("");
    } catch {
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !simDraft.trim()) return;
    setSimulating(true);
    setError(null);
    try {
      const result = await api.simulateInboundWhatsApp(token, customerId, simDraft.trim());
      setMessages((prev) => [...prev, result.inbound, ...result.outbound]);
      setSimDraft("");
    } catch {
      setError("Could not simulate message.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div ref={scrollRef} className="flex max-h-96 min-h-[10rem] flex-col gap-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No WhatsApp messages yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.direction === "INBOUND" ? "justify-start" : "justify-end")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      m.direction === "INBOUND" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    )}
                  >
                    {m.mediaUrl && (
                      <a
                        href={api.resolveAssetUrl(m.mediaUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-1 block text-xs underline opacity-80"
                      >
                        Attachment
                      </a>
                    )}
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {m.direction === "OUTBOUND" && m.sentBy ? `${m.sentBy.name} · ` : ""}
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" disabled={sending || !draft.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border-dashed">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Simulate an incoming customer message (n8n automation demo)
          </div>
          <form onSubmit={handleSimulate} className="flex gap-2">
            <Input
              placeholder='e.g. "I need kids dresses"'
              value={simDraft}
              onChange={(e) => setSimDraft(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" variant="outline" disabled={simulating || !simDraft.trim()}>
              {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Detects intent (AI if configured, keyword match otherwise), matches a catalog category, and auto-sends
            images/brochure/pricing back through the WhatsApp provider — exactly what a real n8n workflow would trigger.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
