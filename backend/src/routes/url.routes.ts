import { Router, Request, Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { Url } from "../models/Url";
import { Click } from "../models/Click";
import { validate } from "../middleware/validate";
import { authenticate, optionalAuth } from "../middleware/auth";
import { createUrlLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../middleware/error";
import { sendSuccess, sendError, AppError, getPagination } from "../utils/helpers";
import { generateShortCode } from "../utils/nanoid";
import { cacheSet, cacheGet, cacheDel } from "../config/redis";
import { env } from "../config/env";

const router = Router();

// ── Validators ────────────────────────────────────────────────────────────────

const createUrlSchema = z.object({
  originalUrl: z.string().url("Must be a valid URL"),
  customAlias: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-_]+$/, "Only lowercase letters, numbers, - and _")
    .optional(),
  expiresAt: z.string().datetime().optional(),
  password: z.string().min(4).max(50).optional(),
  isOneTime: z.boolean().optional().default(false),
  title: z.string().max(100).optional(),
});

const updateUrlSchema = z.object({
  originalUrl: z.string().url().optional(),
  customAlias: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-_]+$/)
    .optional()
    .nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  title: z.string().max(100).optional(),
});

// ── Helper: build short URL ───────────────────────────────────────────────────

const buildShortUrl = (code: string) => `${env.BASE_URL}/${code}`;

// ── POST /api/v1/urls ─────────────────────────────────────────────────────────

router.post(
  "/",
  createUrlLimiter,
  optionalAuth,
  validate(createUrlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { originalUrl, customAlias, expiresAt, password, isOneTime, title } =
      req.body;

    // Check custom alias availability
    if (customAlias) {
      const taken = await Url.findOne({ $or: [{ shortCode: customAlias }, { customAlias }] });
      if (taken) throw new AppError("This alias is already taken", 409);
    }

    // Generate unique short code
    let shortCode = customAlias ?? generateShortCode();
    // Ensure uniqueness (collision is astronomically rare but handle it)
    while (!customAlias) {
      const exists = await Url.findOne({ shortCode });
      if (!exists) break;
      shortCode = generateShortCode();
    }

    // Generate QR code
    const shortUrl = buildShortUrl(customAlias ?? shortCode);
    const qrCode = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    const url = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias ?? undefined,
      user: req.userId ?? undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password: password ?? undefined,
      isOneTime: isOneTime ?? false,
      qrCode,
      title,
    });

    // Cache immediately for fast first redirect
    await cacheSet(`url:${shortCode}`, url.originalUrl, 3600);
    if (customAlias) await cacheSet(`url:${customAlias}`, url.originalUrl, 3600);

    sendSuccess(
      res,
      {
        id: url._id,
        originalUrl: url.originalUrl,
        shortUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        qrCode: url.qrCode,
        expiresAt: url.expiresAt,
        isOneTime: url.isOneTime,
        clicks: 0,
        createdAt: url.createdAt,
      },
      "URL shortened successfully",
      201
    );
  })
);

// ── GET /api/v1/urls — list user's URLs ───────────────────────────────────────

router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const search = (req.query.search as string) ?? "";

    const filter: Record<string, any> = { user: req.userId };
    if (search) {
      filter.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
        { customAlias: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [urls, total] = await Promise.all([
      Url.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v -password"),
      Url.countDocuments(filter),
    ]);

    const enriched = urls.map((u) => ({
      id: u._id,
      originalUrl: u.originalUrl,
      shortUrl: buildShortUrl(u.customAlias ?? u.shortCode),
      shortCode: u.shortCode,
      customAlias: u.customAlias,
      title: u.title,
      clicks: u.clicks,
      isActive: u.isActive,
      expiresAt: u.expiresAt,
      isOneTime: u.isOneTime,
      qrCode: u.qrCode,
      createdAt: u.createdAt,
    }));

    sendSuccess(res, {
      urls: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// ── GET /api/v1/urls/:id — single URL ─────────────────────────────────────────

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findOne({ _id: req.params.id, user: req.userId }).select("-__v -password");
    if (!url) throw new AppError("URL not found", 404);

    sendSuccess(res, {
      id: url._id,
      originalUrl: url.originalUrl,
      shortUrl: buildShortUrl(url.customAlias ?? url.shortCode),
      shortCode: url.shortCode,
      customAlias: url.customAlias,
      title: url.title,
      clicks: url.clicks,
      isActive: url.isActive,
      expiresAt: url.expiresAt,
      isOneTime: url.isOneTime,
      qrCode: url.qrCode,
      createdAt: url.createdAt,
    });
  })
);

// ── PATCH /api/v1/urls/:id ────────────────────────────────────────────────────

router.patch(
  "/:id",
  authenticate,
  validate(updateUrlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findOne({ _id: req.params.id, user: req.userId });
    if (!url) throw new AppError("URL not found", 404);

    const { originalUrl, customAlias, expiresAt, isActive, title } = req.body;

    // Check alias availability if changing it
    if (customAlias && customAlias !== url.customAlias) {
      const taken = await Url.findOne({
        $or: [{ shortCode: customAlias }, { customAlias }],
        _id: { $ne: url._id },
      });
      if (taken) throw new AppError("This alias is already taken", 409);
    }

    // Bust old cache entries
    await cacheDel(`url:${url.shortCode}`);
    if (url.customAlias) await cacheDel(`url:${url.customAlias}`);

    if (originalUrl !== undefined) url.originalUrl = originalUrl;
    if (customAlias !== undefined) url.customAlias = customAlias ?? undefined;
    if (expiresAt !== undefined) url.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (isActive !== undefined) url.isActive = isActive;
    if (title !== undefined) url.title = title;

    await url.save();

    // Re-cache updated value
    await cacheSet(`url:${url.shortCode}`, url.originalUrl, 3600);
    if (url.customAlias) await cacheSet(`url:${url.customAlias}`, url.originalUrl, 3600);

    sendSuccess(res, url, "URL updated successfully");
  })
);

// ── DELETE /api/v1/urls/:id ───────────────────────────────────────────────────

router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findOne({ _id: req.params.id, user: req.userId });
    if (!url) throw new AppError("URL not found", 404);

    // Clean cache + analytics
    await Promise.all([
      cacheDel(`url:${url.shortCode}`, `url:${url.customAlias ?? ""}`),
      Click.deleteMany({ url: url._id }),
      url.deleteOne(),
    ]);

    sendSuccess(res, null, "URL deleted successfully");
  })
);

// ── GET /api/v1/urls/:id/qr — regenerate QR ──────────────────────────────────

router.get(
  "/:id/qr",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const url = await Url.findOne({ _id: req.params.id, user: req.userId });
    if (!url) throw new AppError("URL not found", 404);

    const shortUrl = buildShortUrl(url.customAlias ?? url.shortCode);
    const qrCode = await QRCode.toDataURL(shortUrl, { width: 400, margin: 2 });

    // Persist updated QR
    url.qrCode = qrCode;
    await url.save();

    sendSuccess(res, { qrCode }, "QR code generated");
  })
);

export default router; 