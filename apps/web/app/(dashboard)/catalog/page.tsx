"use client";

import * as React from "react";
import { ImageOff, Loader2, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { ProductDTO } from "@indiamart-crm/shared";

export default function CatalogPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductDTO | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.listProducts(token, {
        q: debouncedSearch || undefined,
        category: category === "ALL" ? undefined : category,
      });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, category]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = React.useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  async function handleDelete(product: ProductDTO) {
    if (!token) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await api.deleteProduct(token, product.id);
    fetchProducts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Catalog</h1>
          <p className="text-sm text-muted-foreground">Browse and manage your product catalog</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <PackagePlus className="h-4 w-4" />
            Add product
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">No products found.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="flex h-36 items-center justify-center bg-muted">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={api.resolveAssetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="space-y-1.5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{product.name}</p>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          setEditing(product);
                          setDialogOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {product.category}
                  </Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-[10px]">
                      {product.subcategory}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-semibold">₹{product.price.toLocaleString("en-IN")}</span>
                  <span className={product.stock > 0 ? "text-muted-foreground" : "text-destructive"}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} onSaved={fetchProducts} />}
    </div>
  );
}
