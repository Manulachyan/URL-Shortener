import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { Url } from "../models/Url";
import { Click } from "../models/Click";

import { asyncHandler } from "../middleware/error";
import { redirectLimiter } from "../middleware/rateLimit";

import {
  AppError,
  parseUserAgent,
} from "../utils/helpers";

import {
  getClientIp,
  getGeoInfo,
} from "../utils/geo";

import {
  cacheGet,
  cacheSet,
  cacheDel,
} from "../config/redis";

import { env } from "../config/env";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /:code
// ─────────────────────────────────────────────────────────────

router.get(
  "/:code",
  redirectLimiter,

  asyncHandler(
    async (req: Request, res: Response) => {
      const code = req.params.code as string;

      // Cache lookup
      const cached =
        await cacheGet<string>(
          `url:${code}`
        );

      if (cached) {
        recordClick(code, req).catch(
          () => {}
        );

        return res.redirect(
          301,
          cached
        );
      }

      // Mongo lookup
      const url = await Url.findOne({
        $or: [
          { shortCode: code },
          { customAlias: code },
        ],
      }).select("+password");

      if (!url) {
        return res.redirect(
          `${env.FRONTEND_URL}/404`
        );
      }

      // Inactive
      if (!url.isActive) {
        return res.redirect(
          `${env.FRONTEND_URL}/404`
        );
      }

      // Expired
      if (
        url.expiresAt &&
        url.expiresAt < new Date()
      ) {
        await cacheDel(
          `url:${code}`
        );

        return res.redirect(
          `${env.FRONTEND_URL}/404`
        );
      }

      // Password protected
      if (url.password) {
        const providedPassword =
          req.query.p as
            | string
            | undefined;

        if (!providedPassword) {
          return res.redirect(
            `${env.FRONTEND_URL}/protected?code=${code}`
          );
        }

        const valid =
          await bcrypt.compare(
            providedPassword,
            url.password
          );

        if (!valid) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Incorrect password",
              data: null,
            });
        }
      }

      // One-time links
      if (url.isOneTime) {
        url.isActive = false;

        await url.save();

        await cacheDel(
          `url:${code}`
        );
      } else {
        await cacheSet(
          `url:${code}`,
          url.originalUrl,
          3600
        );
      }

      // Record click
      recordClick(
        code,
        req,
        url._id.toString()
      ).catch(() => {});

      return res.redirect(
        301,
        url.originalUrl
      );
    }
  )
);

// ─────────────────────────────────────────────────────────────
// POST /:code/unlock
// ─────────────────────────────────────────────────────────────

router.post(
  "/:code/unlock",

  asyncHandler(
    async (req: Request, res: Response) => {
      const code =
        req.params.code as string;

      const { password } = req.body;

      if (!password) {
        throw new AppError(
          "Password is required",
          400
        );
      }

      const url = await Url.findOne({
        $or: [
          { shortCode: code },
          { customAlias: code },
        ],
      }).select("+password");

      if (
        !url ||
        !url.isActive
      ) {
        throw new AppError(
          "Link not found",
          404
        );
      }

      if (!url.password) {
        return res.json({
          success: true,
          message: "Redirect",
          data: {
            originalUrl:
              url.originalUrl,
          },
        });
      }

      const valid =
        await bcrypt.compare(
          password,
          url.password
        );

      if (!valid) {
        throw new AppError(
          "Incorrect password",
          401
        );
      }

      return res.json({
        success: true,
        message: "Unlocked",
        data: {
          originalUrl:
            url.originalUrl,
        },
      });
    }
  )
);

// ─────────────────────────────────────────────────────────────
// Record Click
// ─────────────────────────────────────────────────────────────

async function recordClick(
  code: string,
  req: Request,
  urlId?: string
): Promise<void> {
  let resolvedId = urlId;

  // Resolve url ID
  if (!resolvedId) {
    const url =
      await Url.findOne({
        $or: [
          { shortCode: code },
          { customAlias: code },
        ],
      }).select("_id");

    if (!url) {
      return;
    }

    resolvedId =
      url._id.toString();
  }

  // Increment clicks
  await Url.findByIdAndUpdate(
    resolvedId,
    {
      $inc: {
        clicks: 1,
      },
    }
  );

  const ua =
    (
      req.headers[
        "user-agent"
      ] || ""
    ).toString();

  const ip =
    getClientIp(req);

  const geo =
    getGeoInfo(ip);

  const device =
    parseUserAgent(ua);

  const referrer =
    req.headers.referer ??
    req.headers.referrer ??
    "Direct";

  await Click.create({
    url: resolvedId,

    ip,

    country: geo.country,

    city: geo.city,

    region: geo.region,

    browser:
      device.browser,

    os: device.os,

    device:
      device.device.toLowerCase() as
    | "mobile"
    | "tablet"
    | "desktop",

    referrer:
      typeof referrer ===
      "string"
        ? referrer
        : referrer[0] ??
          "Direct",
  });
}

export default router;