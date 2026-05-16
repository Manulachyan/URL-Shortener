import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validate request body using Zod schema
 */
export const validate =
  (schema: ZodSchema) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const result = schema.safeParse(req.body);

    // Validation failed
    if (!result.success) {
      const errors = (
        result.error as ZodError
      ).flatten().fieldErrors;

      // Convert errors into readable string
      const message = Object.entries(errors)
        .map(([field, msgs]) => {
          const messages = Array.isArray(msgs)
            ? msgs.join(", ")
            : "Invalid value";

          return `${field}: ${messages}`;
        })
        .join(" | ");

      res.status(400).json({
        success: false,
        message,
        data: null,
      });

      return;
    }

    // Replace body with validated data
    req.body = result.data;

    next();
  };