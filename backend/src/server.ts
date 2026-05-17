import "dotenv/config"; 
import app from "./app";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";
import { env } from "./config/env";
import { logger } from "./utils/helpers";
import fs from "fs";

// Ensure log directory exists
if (!fs.existsSync("logs")) fs.mkdirSync("logs");

const PORT = parseInt(env.PORT, 10);

const start = async (): Promise<void> => {
  try {
    // Connect to databases first
    await connectDB();
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${env.NODE_ENV}]`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/v1/health`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ── Unhandled rejections / exceptions ─────────────────────────────────────
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

start(); 