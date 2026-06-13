import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Failed validation = client's fault → 400, with the offending fields.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { message: "Invalid request parameters", details: err.issues },
    });
  }

  // Unexpected fault → 500. Log for us; send the client a generic message (no internals).
  console.error(err);
  return res.status(500).json({
    error: { message: "Internal server error" },
  });
}
