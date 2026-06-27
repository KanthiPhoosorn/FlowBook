import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wrap async route handlers so thrown/rejected errors reach the error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// 501 stub for endpoints owned by a teammate (keeps the API contract visible).
export const notImplemented =
  (owner: string, task: string): RequestHandler =>
  (_req, res) =>
    res.status(501).json({ error: "Not implemented yet", owner, task });

// Validate a request body with a zod schema, throwing a 400 on failure.
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, "Validation failed", result.error.flatten());
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  const e = err as { code?: string; meta?: unknown };
  if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
  if (e?.code === "P2002") return res.status(409).json({ error: "Duplicate value", details: e.meta });
  if (e?.code === "P2003") return res.status(400).json({ error: "Related record not found", details: e.meta });
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
