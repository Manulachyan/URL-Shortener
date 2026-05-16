import Redis from "ioredis";

import { env } from "./env";
import { logger } from "../utils/helpers";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
});

// ─────────────────────────────────────────────────────────────
// Redis Events
// ─────────────────────────────────────────────────────────────

redis.on("connect", () => {
  logger.info("✅ Redis connected");
});

redis.on("error", (err: Error) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

// ─────────────────────────────────────────────────────────────
// Connect Redis
// ─────────────────────────────────────────────────────────────

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};

// ─────────────────────────────────────────────────────────────
// Cache Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Store cache
 */
export const cacheSet = async (
  key: string,
  value: unknown,
  ttl = 3600
): Promise<void> => {
  await redis.set(
    key,
    JSON.stringify(value),
    "EX",
    ttl
  );
};

/**
 * Get cache
 */
export const cacheGet = async <T = unknown>(
  key: string
): Promise<T | null> => {
  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
};

/**
 * Delete cache
 */
export const cacheDel = async (
  ...keys: string[]
): Promise<void> => {
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

/**
 * Increment cache value
 */
export const cacheIncr = async (
  key: string,
  ttl?: number
): Promise<number> => {
  const value = await redis.incr(key);

  if (ttl && value === 1) {
    await redis.expire(key, ttl);
  }

  return value;
};

export default redis; 