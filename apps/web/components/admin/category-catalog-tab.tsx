"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { CatalogDTO, CategoryDTO, ProductDTO } from "@indiamart-crm/shared";

function flatten(categories: CategoryDTO[], depth = 0): { id: string; label: string }[] {
  return categories.flatMap((c) => [{ id: c.id, label: `${"— ".repeat(depth)}${c.name}` }, ...flatten(c.children, depth + 1)]);
}

export function CategoryCatalogTab() {
  const { token } = useAuth();
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [catalogs, setCatalogs] = React.useState<CatalogDTO[]>([]);
  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryParent, setNewCategoryParent] = React.useState<string>("NONE");

  const [newCatalogName, setNewCatalogName] = React.useState("");
  const [newCatalogCategory, setNewCatalogCategory] = React.useState<string>("NONE");
  const [newCatalogProducts, setNewCatalogProducts] = React.useState<Set<string>>(new Set());

  const fetchAll = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cats, cats2, prods] = await Promise.all([api.listCategories(token), api.listCatalogs(token), api.listProducts(token)]);
      setCategories(cats);
      setCatalogs(cats2);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const flatCategories = React.useMemo(() => flatten(categories), [categories]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newCategoryName.trim()) return;
    await api.createCategory(token, { name: newCategoryName.trim(), parentId: newCategoryParent === "NONE" ? undefined : newCategoryParent });
    setNewCategoryName("");
    setNewCategoryParent("NONE");
    fetchAll();
  }

  async function handleDeleteCategory(id: string) {
    if (!token || !window.confirm("Delete this category?")) return;
    try {
      await api.deleteCategory(token, id);
      fetchAll();
    } catch (err) {
      window.alert(err instanceof api.ApiError ? err.message : "Could not delete category.");
    }
  }

  function toggleProduct(id: string) {
    setNewCatalogProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateCatalog(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newCatalogName.trim()) return;
    await api.createCatalog(token, {
      name: newCatalogName.trim(),
      categoryId: newCatalogCategory === "NONE" ? undefined : newCatalogCategory,
      productIds: Array.from(newCatalogProducts),
    });
    setNewCatalogName("");
    setNewCatalogCategory("NONE");
    setNewCatalogProducts(new Set());
    fetchAll();
  }

  async function handleDeleteCatalog(id: string) {
    if (!token || !window.confirm("Delete this catalog?")) return;
    await api.deleteCatalog(token, id);
    fetchAll();
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1 space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Kids" />
            </div>
            <div className="w-40 space-y-1.5">
              <Label>Parent</Label>
              <Select value={newCategoryParent} onValueChange={setNewCategoryParent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Top-level</SelectItem>
                  {flatCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={!newCategoryName.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </form>

          <ul className="divide-y">
            {flatCategories.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No categories yet.</p>
            ) : (
              flatCategories.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{c.label}</span>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Catalogs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleCreateCatalog} className="space-y-2.5 rounded-md border p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-catalog-name">Name</Label>
                <Input id="cat-catalog-name" value={newCatalogName} onChange={(e) => setNewCatalogName(e.target.value)} placeholder="e.g. Kids Collection" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={newCatalogCategory} onValueChange={setNewCatalogCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {flatCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Products</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No products yet — add some in Catalog.</p>
                ) : (
                  products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={newCatalogProducts.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                      {p.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <Button type="submit" size="sm" disabled={!newCatalogName.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Create catalog
            </Button>
          </form>

          <ul className="divide-y">
            {catalogs.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No catalogs yet — WhatsApp auto-send needs at least one.</p>
            ) : (
              catalogs.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.category?.path ?? "No category"} · {c.products.length} product{c.products.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteCatalog(c.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
