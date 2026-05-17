import { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────
// Success Response Helper
// ─────────────────────────────────────────────────────────────

export const sendSuccess = (
  res: Response,
  data: unknown = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// ─────────────────────────────────────────────────────────────
// Error Response Helper
// ─────────────────────────────────────────────────────────────

export const sendError = (
  res: Response,
  message = "Error",
  statusCode = 500,
  data: unknown = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

// ─────────────────────────────────────────────────────────────
// Custom Error Class
// ─────────────────────────────────────────────────────────────

export class AppError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 500
  ) {
    super(message);

    this.statusCode = statusCode;

    Object.setPrototypeOf(
      this,
      AppError.prototype
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Pagination Helper
// ─────────────────────────────────────────────────────────────

export const getPagination = (
  req: Request
) => {
  const page = Math.max(
    parseInt(req.query.page as string) || 1,
    1
  );

  const limit = Math.max(
    parseInt(req.query.limit as string) || 10,
    1
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

// ─────────────────────────────────────────────────────────────
// User Agent Parser
// ─────────────────────────────────────────────────────────────

export const parseUserAgent = (
  ua: string
) => {
  const userAgent = ua.toLowerCase();

  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Browser detection
  if (userAgent.includes("chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("safari")) {
    browser = "Safari";
  } else if (userAgent.includes("edge")) {
    browser = "Edge";
  }

  // OS detection
  if (userAgent.includes("windows")) {
    os = "Windows";
  } else if (userAgent.includes("mac")) {
    os = "macOS";
  } else if (userAgent.includes("linux")) {
    os = "Linux";
  } else if (userAgent.includes("android")) {
    os = "Android";
  } else if (
    userAgent.includes("iphone") ||
    userAgent.includes("ios")
  ) {
    os = "iOS";
  }

  // Device detection
  if (
    userAgent.includes("mobile") ||
    userAgent.includes("android") ||
    userAgent.includes("iphone")
  ) {
    device = "Mobile";
  } else if (userAgent.includes("tablet")) {
    device = "Tablet";
  }

  return {
    browser,
    os,
    device,
  };
};

// ─────────────────────────────────────────────────────────────
// Logger
// ─────────────────────────────────────────────────────────────

export const logger = {
  info: (...args: unknown[]) => {
    console.log("[INFO]", ...args);
  },

  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },

  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },

  http: (...args: unknown[]) => {
    console.log("[HTTP]", ...args);
  },
};