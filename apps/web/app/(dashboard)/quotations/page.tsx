"use client";

import * as React from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function QuotationsPage() {
  const { token } = useAuth();
  const [quotations, setQuotations] = React.useState<QuotationDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    api
      .listQuotations(token)
      .then(setQuotations)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quotations</h1>
          <p className="text-sm text-muted-foreground">Quotations you've created</p>
        </div>
        <Button asChild>
          <Link href="/quotations/new">
            <FilePlus2 className="h-4 w-4" />
            New quotation
          </Link>
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No quotations yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/quotations/${q.id}`} className="font-medium hover:underline">
                      {q.customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{q.customer.phone}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.items.length}</TableCell>
                  <TableCell className="text-sm font-medium">₹{q.total.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
