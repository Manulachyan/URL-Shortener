import { Request, Response, NextFunction } from "express";
import { AppError, logger } from "../utils/helpers";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log every error
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, {
    stack: err.stack,
  });

  // Known operational errors (thrown by us)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  // Mongoose duplicate key error (e.g. duplicate email / shortCode)
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue ?? {})[0] ?? "field";
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
      data: null,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values((err as any).errors).map(
      (e: any) => e.message
    );
    res.status(400).json({
      success: false,
      message: messages.join(", "),
      data: null,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
      data: null,
    });
    return;
  }

  // Unknown / unhandled errors
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
    data: null,
  });
};

/** Catch async route errors without try/catch in every handler */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  }; 