import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError, sendError } from "../utils/helpers";
import { User } from "../models/User";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "user" | "admin";
    }
  }
}

/** Verifies JWT from Authorization header */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "No token provided", 401);
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select("isActive role");
    if (!user || !user.isActive) {
      sendError(res, "User not found or deactivated", 401);
      return;
    }

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      sendError(res, err.message, err.statusCode);
    } else {
      sendError(res, "Authentication failed", 401);
    }
  }
};

/** Optional auth — attaches user if token present, doesn't block if absent */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);
      req.userId = payload.userId;
      req.userRole = payload.role;
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};

/** Must be called after authenticate */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== "admin") {
    sendError(res, "Admin access required", 403);
    return;
  }
  next();
}; 