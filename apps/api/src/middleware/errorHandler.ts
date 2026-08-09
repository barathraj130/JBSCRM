import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class DuplicateCustomerError extends HttpError {
  customerId: string;
  constructor(customerId: string) {
    super(409, "Customer already exists");
    this.customerId = customerId;
  }
}

/** Thrown when a status/completion claim has no verified evidence and no proof was attached — the
 * frontend detects this by error code and offers a screenshot upload instead of just showing an error. */
export class EvidenceRequiredError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof DuplicateCustomerError) {
    return res.status(err.status).json({ error: "DUPLICATE_CUSTOMER", message: err.message, customerId: err.customerId });
  }
  if (err instanceof EvidenceRequiredError) {
    return res.status(err.status).json({ error: "EVIDENCE_REQUIRED", message: err.message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
