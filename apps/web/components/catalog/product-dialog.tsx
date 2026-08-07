"use client";

import * as React from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { ProductDTO } from "@indiamart-crm/shared";

const emptyForm = { name: "", description: "", price: "", stock: "", category: "", subcategory: "" };

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: ProductDTO | null;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = React.useState(emptyForm);
  const [images, setImages] = React.useState<string[]>([]);
  const [video, setVideo] = React.useState<string | undefined>(undefined);
  const [brochureUrl, setBrochureUrl] = React.useState<string | undefined>(undefined);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              description: product.description ?? "",
              price: String(product.price),
              stock: String(product.stock),
              category: product.category,
              subcategory: product.subcategory ?? "",
            }
          : emptyForm
      );
      setImages(product?.images ?? []);
      setVideo(product?.videos[0]);
      setBrochureUrl(product?.brochureUrl ?? undefined);
      setError(null);
    }
  }, [open, product]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!token || files.length === 0) return;
    setUploading("images");
    try {
      const uploaded = await Promise.all(files.map((f) => api.uploadFile(token, f)));
      setImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  async function handleSingleUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "video" | "brochure") {
    const file = e.target.files?.[0];
    if (!token || !file) return;
    setUploading(kind);
    try {
      const { url } = await api.uploadFile(token, file);
      if (kind === "video") setVideo(url);
      else setBrochureUrl(url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!form.name.trim() || !form.category.trim() || !form.price || !form.stock) {
      setError("Name, category, price, and stock are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category.trim(),
        subcategory: form.subcategory || undefined,
        images,
        videos: video ? [video] : [],
        brochureUrl,
      };
      if (product) {
        await api.updateProduct(token, product.id, payload);
      } else {
        await api.createProduct(token, payload);
      }
      onOpenChange(false);
      onSaved();
    } catch {
      setError("Could not save product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-name">Name *</Label>
              <Input id="p-name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (₹) *</Label>
              <Input id="p-price" type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stock *</Label>
              <Input id="p-stock" type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Category *</Label>
              <Input id="p-category" value={form.category} onChange={(e) => update("category", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-subcategory">Subcategory</Label>
              <Input id="p-subcategory" value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={api.resolveAssetUrl(url)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-accent">
                {uploading === "images" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Video</Label>
              <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
                {uploading === "video" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {video ? "Replace video" : "Upload video"}
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleSingleUpload(e, "video")} />
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Brochure (PDF)</Label>
              <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent">
                {uploading === "brochure" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {brochureUrl ? "Replace PDF" : "Upload PDF"}
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleSingleUpload(e, "brochure")} />
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting || uploading !== null}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Add product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
