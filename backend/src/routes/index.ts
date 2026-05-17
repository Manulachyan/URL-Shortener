import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import urlRoutes from "./url.routes";
import analyticsRoutes from "./analytics.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

router.use("/auth", authRoutes);
router.use("/urls", urlRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);

export default router; 