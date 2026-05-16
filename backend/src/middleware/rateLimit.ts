import rateLimit from "express-rate-limit";

const makeLimit = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message, data: null },
    standardHeaders: true,
    legacyHeaders: false,
    // Use IP + optional user id as key
    keyGenerator: (req) =>
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
      req.ip ??
      "unknown",
  });

/** Global limiter — applied to all routes */
export const globalLimiter = makeLimit(
  15 * 60 * 1000, // 15 minutes
  200,
  "Too many requests, please try again later"
);

/** Strict limiter for auth endpoints */
export const authLimiter = makeLimit(
  15 * 60 * 1000, // 15 minutes
  10,
  "Too many auth attempts, please try again in 15 minutes"
);

/** Limiter for URL creation */
export const createUrlLimiter = makeLimit(
  60 * 60 * 1000, // 1 hour
  50,
  "URL creation limit reached, try again in an hour"
);

/** Limiter for redirect endpoint — generous but protects from abuse */
export const redirectLimiter = makeLimit(
  60 * 1000, // 1 minute
  120,
  "Too many redirects from this IP"
); 