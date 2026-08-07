import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { toProductDTO } from "@/utils/mappers";
import type { CreateProductInput, UpdateProductInput } from "@indiamart-crm/shared";

export async function listProducts(filter: { q?: string; category?: string }) {
  const where: Prisma.ProductWhereInput = {};
  if (filter.category) where.category = filter.category;
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { description: { contains: filter.q, mode: "insensitive" } },
      { category: { contains: filter.q, mode: "insensitive" } },
    ];
  }
  const products = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } });
  return products.map(toProductDTO);
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new HttpError(404, "Product not found");
  return toProductDTO(product);
}

export async function createProduct(input: CreateProductInput) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      category: input.category,
      subcategory: input.subcategory,
      images: input.images ?? [],
      videos: input.videos ?? [],
      brochureUrl: input.brochureUrl,
    },
  });
  return toProductDTO(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await prisma.product.update({ where: { id }, data: input });
  return toProductDTO(product);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}
