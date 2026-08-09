"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { CustomerRefDTO, LeadDTO, ProductDTO } from "@indiamart-crm/shared";

interface LineItem {
  key: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

function emptyItem(): LineItem {
  return { key: crypto.randomUUID(), name: "", quantity: 1, unitPrice: 0 };
}

export default function NewQuotationPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const [customer, setCustomer] = React.useState<CustomerRefDTO | null>(null);
  const [leads, setLeads] = React.useState<LeadDTO[]>([]);
  const [leadsLoading, setLeadsLoading] = React.useState(false);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>("");
  const [phoneSearch, setPhoneSearch] = React.useState("");
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [items, setItems] = React.useState<LineItem[]>([emptyItem()]);
  const [gstPercent, setGstPercent] = React.useState("18");
  const [discount, setDiscount] = React.useState("0");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    api.listProducts(token).then(setProducts);
  }, [token]);

  React.useEffect(() => {
    if (!token || !customerIdParam) return;
    api.getCustomer(token, customerIdParam).then((c) => setCustomer(c));
  }, [token, customerIdParam]);

  const fetchLeadsForCustomer = React.useCallback(
    async (customerId: string) => {
      if (!token) return;
      setLeadsLoading(true);
      try {
        const detail = await api.getCustomer(token, customerId);
        setLeads(detail.leads);
        setSelectedLeadId(detail.leads.length === 1 ? detail.leads[0].id : "");
      } finally {
        setLeadsLoading(false);
      }
    },
    [token]
  );

  React.useEffect(() => {
    if (customer) fetchLeadsForCustomer(customer.id);
    else {
      setLeads([]);
      setSelectedLeadId("");
    }
  }, [customer, fetchLeadsForCustomer]);

  async function handleLookup() {
    if (!token || !phoneSearch.trim()) return;
    setLookupError(null);
    const found = await api.lookupCustomerByPhone(token, phoneSearch.trim());
    if (found) setCustomer(found);
    else setLookupError("No customer found with that phone number.");
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  function applyProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(key, { productId: product.id, name: product.name, unitPrice: product.price });
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountNum = Number(discount) || 0;
  const gstNum = Number(gstPercent) || 0;
  const taxable = Math.max(subtotal - discountNum, 0);
  const gstAmount = (taxable * gstNum) / 100;
  const total = taxable + gstAmount;

  async function handleSubmit() {
    if (!token || !customer) return;
    const validItems = items.filter((i) => i.name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Add at least one item.");
      return;
    }
    if (leads.length > 0 && !selectedLeadId) {
      setError("Select which lead this quotation is for.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const quotation = await api.createQuotation(token, {
        customerId: customer.id,
        leadId: selectedLeadId || undefined,
        gstPercent: gstNum,
        discount: discountNum,
        items: validItems.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      });
      router.push(`/quotations/${quotation.id}`);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Could not create quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New quotation</h1>
        <p className="text-sm text-muted-foreground">Build a quotation and send it to your customer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Customer</CardTitle>
        </CardHeader>
        <CardContent>
          {customer ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.phone}</p>
              </div>
              {!customerIdParam && (
                <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                  Change
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Search by phone number" value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} />
                <Button type="button" onClick={handleLookup}>
                  <Search className="h-4 w-4" />
                  Find
                </Button>
              </div>
              {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Lead</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <p className="text-sm text-muted-foreground">Loading leads...</p>
            ) : leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This customer has no leads yet — the quotation will be linked to the customer only.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label>Which lead is this quotation for? *</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.productInterested ?? "General inquiry"} · {l.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Marking this lead as &ldquo;Quotation Sent&rdquo; later requires this quotation to be linked to it.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-32">Unit price</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <Select value={item.productId ?? ""} onValueChange={(v) => applyProduct(item.key, v)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Pick..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={item.name}
                      onChange={(e) => updateItem(item.key, { name: e.target.value })}
                      placeholder="Item name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell className="text-sm">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <button onClick={() => removeItem(item.key)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="gst">GST %</Label>
            <Input id="gst" type="number" min="0" max="100" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount (₹)</Label>
            <Input id="discount" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1 text-right text-sm">
            <p className="text-muted-foreground">Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
            <p className="text-muted-foreground">GST: ₹{gstAmount.toLocaleString("en-IN")}</p>
            <p className="text-base font-semibold">Total: ₹{total.toLocaleString("en-IN")}</p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={!customer || submitting || (leads.length > 0 && !selectedLeadId)} className="w-full">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save quotation
      </Button>
    </div>
  );
}
