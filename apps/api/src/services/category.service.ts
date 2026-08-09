import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { toCategoryDTO } from "@/utils/mappers";
import type { CreateCategoryInput, UpdateCategoryInput } from "@indiamart-crm/shared";
import type { Category } from "@prisma/client";

function buildTree(categories: Category[]): Category[] {
  const byParent = new Map<string | null, (Category & { children: Category[] })[]>();
  const withChildren = categories.map((c) => ({ ...c, children: [] as Category[] }));
  for (const c of withChildren) {
    const key = c.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const c of withChildren) {
    c.children = byParent.get(c.id) ?? [];
  }
  return byParent.get(null) ?? [];
}

export async function listCategories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return buildTree(categories).map((c) => toCategoryDTO(c));
}

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new HttpError(400, "Parent category not found");
  }
  const category = await prisma.category.create({ data: { name: input.name, parentId: input.parentId ?? null } });
  return toCategoryDTO(category);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  if (input.parentId) {
    if (input.parentId === id) throw new HttpError(400, "A category cannot be its own parent");
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new HttpError(400, "Parent category not found");
  }
  const category = await prisma.category.update({ where: { id }, data: input });
  return toCategoryDTO(category);
}

export async function deleteCategory(id: string) {
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (productCount > 0) throw new HttpError(400, "Cannot delete a category that still has products. Move them first.");
  if (childCount > 0) throw new HttpError(400, "Cannot delete a category that still has subcategories.");
  await prisma.category.delete({ where: { id } });
}
