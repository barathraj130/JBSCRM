import type { Request, Response } from "express";
import { z } from "zod";
import * as productService from "@/services/product.service";
import { HttpError } from "@/middleware/errorHandler";

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export async function listHandler(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const products = await productService.listProducts(query);
  res.json(products);
}

export async function getHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing product id");
  const product = await productService.getProduct(req.params.id);
  res.json(product);
}

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  brochureUrl: z.string().optional(),
});

export async function createHandler(req: Request, res: Response) {
  const input = productSchema.parse(req.body);
  const product = await productService.createProduct(input);
  res.status(201).json(product);
}

export async function updateHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing product id");
  const input = productSchema.partial().parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  res.json(product);
}

export async function deleteHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing product id");
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
}
