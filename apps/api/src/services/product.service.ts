import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { toProductDTO } from "@/utils/mappers";
import type { CreateProductInput, UpdateProductInput } from "@indiamart-crm/shared";

const productInclude = { category: { include: { parent: true } } } satisfies Prisma.ProductInclude;

export async function listProducts(filter: { q?: string; categoryId?: string }) {
  const where: Prisma.ProductWhereInput = {};
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { description: { contains: filter.q, mode: "insensitive" } },
      { category: { name: { contains: filter.q, mode: "insensitive" } } },
    ];
  }
  const products = await prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: "desc" } });
  return products.map(toProductDTO);
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw new HttpError(404, "Product not found");
  return toProductDTO(product);
}

export async function createProduct(input: CreateProductInput) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new HttpError(400, "Category not found");

  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      categoryId: input.categoryId,
      images: input.images ?? [],
      videos: input.videos ?? [],
      brochureUrl: input.brochureUrl,
    },
    include: productInclude,
  });
  return toProductDTO(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new HttpError(400, "Category not found");
  }
  const product = await prisma.product.update({ where: { id }, data: input, include: productInclude });
  return toProductDTO(product);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}
