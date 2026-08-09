import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { toCatalogDTO } from "@/utils/mappers";
import type { CreateCatalogInput, UpdateCatalogInput } from "@indiamart-crm/shared";

const catalogInclude = {
  category: { include: { parent: true } },
  products: { include: { product: { include: { category: { include: { parent: true } } } } } },
} satisfies Prisma.CatalogInclude;

export async function listCatalogs() {
  const catalogs = await prisma.catalog.findMany({ include: catalogInclude, orderBy: { name: "asc" } });
  return catalogs.map(toCatalogDTO);
}

export async function getCatalog(id: string) {
  const catalog = await prisma.catalog.findUnique({ where: { id }, include: catalogInclude });
  if (!catalog) throw new HttpError(404, "Catalog not found");
  return toCatalogDTO(catalog);
}

export async function createCatalog(input: CreateCatalogInput) {
  const catalog = await prisma.catalog.create({
    data: {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      products: { create: input.productIds.map((productId) => ({ productId })) },
    },
    include: catalogInclude,
  });
  return toCatalogDTO(catalog);
}

export async function updateCatalog(id: string, input: UpdateCatalogInput) {
  const data: Prisma.CatalogUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.categoryId !== undefined) data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };

  if (input.productIds) {
    await prisma.catalogProduct.deleteMany({ where: { catalogId: id } });
    data.products = { create: input.productIds.map((productId) => ({ productId })) };
  }

  const catalog = await prisma.catalog.update({ where: { id }, data, include: catalogInclude });
  return toCatalogDTO(catalog);
}

export async function deleteCatalog(id: string) {
  await prisma.catalog.delete({ where: { id } });
}

/**
 * Resolves the best-matching Catalog for a set of detected category/subcategory names
 * (used by the WhatsApp auto-send pipeline). Falls back to null if nothing matches,
 * letting the caller fall back to a generic reply.
 */
export async function findCatalogForCategoryNames(names: string[]) {
  if (names.length === 0) return null;
  const catalog = await prisma.catalog.findFirst({
    where: { category: { name: { in: names, mode: "insensitive" } } },
    include: catalogInclude,
  });
  return catalog;
}
