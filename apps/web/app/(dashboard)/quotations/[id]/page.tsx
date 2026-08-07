"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { QuotationDTO, QuotationStatus } from "@indiamart-crm/shared";

const STATUS_VARIANT: Record<QuotationStatus, "secondary" | "default" | "outline" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  VIEWED: "outline",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default function QuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [quotation, setQuotation] = React.useState<QuotationDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sentMessage, setSentMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchQuotation = React.useCallback(async () => {
    if (!token || !params.id) return;
    setLoading(true);
    try {
      const data = await api.getQuotation(token, params.id);
      setQuotation(data);
    } catch {
      setError("Could not load quotation.");
    } finally {
      setLoading(false);
    }
  }, [token, params.id]);

  React.useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  async function handleDownload() {
    if (!token || !quotation) return;
    setDownloading(true);
    try {
      const blob = await api.getQuotationPdfBlob(token, quotation.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setError("Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!token || !quotation) return;
    setSending(true);
    setSentMessage(null);
    try {
      await api.sendQuotationWhatsApp(token, quotation.id);
      setSentMessage(`Sent to ${quotation.customer.phone} (mock WhatsApp provider — see server logs).`);
      fetchQuotation();
    } catch {
      setError("Could not send via WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quotation) {
    return <p className="text-sm text-destructive">{error ?? "Quotation not found."}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/quotations")} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to quotations
      </Button>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Quotation #{quotation.id.slice(-8).toUpperCase()}</h1>
              <Badge variant={STATUS_VARIANT[quotation.status]}>{quotation.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {quotation.customer.name} · {quotation.customer.phone}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>
            <Button onClick={handleSendWhatsApp} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Send via WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {sentMessage && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {sentMessage}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-16">Qty</TableHead>
                <TableHead className="w-28">Unit price</TableHead>
                <TableHead className="w-28">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.unitPrice.toLocaleString("en-IN")}</TableCell>
                  <TableCell>₹{item.lineTotal.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="ml-auto mt-4 w-52 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{quotation.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-₹{quotation.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({quotation.gstPercent}%)</span>
              <span>₹{Math.round(((quotation.subtotal - quotation.discount) * quotation.gstPercent) / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>₹{quotation.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
