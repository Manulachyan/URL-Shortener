import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { Url } from "../models/Url";
import { Click } from "../models/Click";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { sendSuccess, AppError, getPagination } from "../utils/helpers";
import { cacheDel } from "../config/redis";

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// ── GET /api/v1/admin/stats — system overview ─────────────────────────────────

router.get(
  "/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    const [totalUsers, totalUrls, totalClicks, activeUrls] = await Promise.all([
      User.countDocuments(),
      Url.countDocuments(),
      Click.countDocuments(),
      Url.countDocuments({ isActive: true }),
    ]);

    // New users last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: since } });

    sendSuccess(res, {
      totalUsers,
      totalUrls,
      totalClicks,
      activeUrls,
      newUsers,
    });
  })
);

// ── GET /api/v1/admin/users — paginated user list ─────────────────────────────

router.get(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const search = (req.query.search as string) ?? "";

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v -googleId -apiKey"),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// ── PATCH /api/v1/admin/users/:id/toggle — activate / deactivate ──────────────

router.patch(
  "/users/:id/toggle",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin") throw new AppError("Cannot deactivate an admin", 403);

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, { isActive: user.isActive }, `User ${user.isActive ? "activated" : "deactivated"}`);
  })
);

// ── PATCH /api/v1/admin/users/:id/role — promote / demote ────────────────────

router.patch(
  "/users/:id/role",
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      throw new AppError("Role must be 'user' or 'admin'", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name email role");

    if (!user) throw new AppError("User not found", 404);

    sendSuccess(res, user, `Role updated to ${role}`);
  })
);

// ── DELETE /api/v1/admin/users/:id — delete user and all their data ───────────

router.delete(
  "/users/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin") throw new AppError("Cannot delete an admin", 403);

    // Find all URLs by this user
    const urls = await Url.find({ user: user._id }).select("_id shortCode customAlias");

    // Clean up cache for each URL
    const cacheKeys = urls.flatMap((u) => [
      `url:${u.shortCode}`,
      ...(u.customAlias ? [`url:${u.customAlias}`] : []),
    ]);
    if (cacheKeys.length) await cacheDel(...cacheKeys);

    // Cascade delete: clicks → urls → user
    const urlIds = urls.map((u) => u._id);
    await Click.deleteMany({ url: { $in: urlIds } });
    await Url.deleteMany({ user: user._id });
    await user.deleteOne();

    sendSuccess(res, null, "User and all associated data deleted");
  })
);

// ── GET /api/v1/admin/urls — all URLs with owner info ────────────────────────

router.get(
  "/urls",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const search = (req.query.search as string) ?? "";

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
      ];
    }

    const [urls, total] = await Promise.all([
      Url.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v -password -qrCode"),
      Url.countDocuments(filter),
    ]);

    sendSuccess(res, {
      urls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// ── PATCH /api/v1/admin/urls/:id/toggle — activate / deactivate URL ──────────

router.patch(
  "/urls/:id/toggle",
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findById(req.params.id);
    if (!url) throw new AppError("URL not found", 404);

    url.isActive = !url.isActive;
    await url.save();

    // Bust cache
    await cacheDel(`url:${url.shortCode}`);
    if (url.customAlias) await cacheDel(`url:${url.customAlias}`);

    sendSuccess(res, { isActive: url.isActive }, `URL ${url.isActive ? "activated" : "deactivated"}`);
  })
);

// ── DELETE /api/v1/admin/urls/:id — force delete any URL ─────────────────────

router.delete(
  "/urls/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findById(req.params.id);
    if (!url) throw new AppError("URL not found", 404);

    await Promise.all([
      cacheDel(`url:${url.shortCode}`, ...(url.customAlias ? [`url:${url.customAlias}`] : [])),
      Click.deleteMany({ url: url._id }),
      url.deleteOne(),
    ]);

    sendSuccess(res, null, "URL deleted");
  })
);

export default router; 