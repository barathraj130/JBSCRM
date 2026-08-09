import type { Request, Response } from "express";
import { z } from "zod";
import * as catalogService from "@/services/catalog.service";
import { HttpError } from "@/middleware/errorHandler";

export async function listHandler(_req: Request, res: Response) {
  res.json(await catalogService.listCatalogs());
}

export async function getHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing catalog id");
  res.json(await catalogService.getCatalog(req.params.id));
}

const catalogSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  productIds: z.array(z.string()).default([]),
});

export async function createHandler(req: Request, res: Response) {
  const input = catalogSchema.parse(req.body);
  res.status(201).json(await catalogService.createCatalog({ ...input, categoryId: input.categoryId ?? undefined }));
}

export async function updateHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing catalog id");
  const input = catalogSchema.partial().parse(req.body);
  res.json(
    await catalogService.updateCatalog(req.params.id, {
      ...input,
      categoryId: input.categoryId === null ? undefined : input.categoryId,
    })
  );
}

export async function deleteHandler(req: Request, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing catalog id");
  await catalogService.deleteCatalog(req.params.id);
  res.status(204).send();
}
