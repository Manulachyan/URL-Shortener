import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.string().default("5000"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 chars"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),

  JWT_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  BASE_URL: z.url("BASE_URL must be a valid URL"),

  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),

  BCRYPT_ROUNDS: z.string().default("12"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;