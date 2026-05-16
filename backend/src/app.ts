import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env";
import { logger } from "./utils/helpers";
import { globalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/error";
import apiRoutes from "./routes/index";
import redirectRoutes from "./routes/redirect.routes";

const app: Application = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logging ──────────────────────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Trust proxy (for correct IPs behind NGINX/load balancer) ─────────────────
app.set("trust proxy", 1);

// ── API routes (versioned) ────────────────────────────────────────────────────
app.use("/api/v1", apiRoutes);

// ── Redirect engine — must come AFTER /api to avoid conflicts ─────────────────
app.use(redirectRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found", data: null });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app; 