import type { Request, Response } from "express";
import { z } from "zod";
import * as categoryService from "@/services/category.service";
import { HttpError } from "@/middleware/errorHandler";

export async function listHandler(_req: Request, res: Response) {
  res.json(await categoryService.listCategories());
}

const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

export async function createHandler(req: Request, res: Response) {
  const input = categorySchema.parse(req.body);
  res.status(201).json(await categoryService.createCategory(input));
}

export async function updateHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing category id");
  const input = categorySchema.partial().parse(req.body);
  res.json(await categoryService.updateCategory(req.params.id, input));
}

export async function deleteHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing category id");
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
}
