import { Router, Request, Response } from "express";
import { Url } from "../models/Url";
import { Click } from "../models/Click";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { sendSuccess, AppError } from "../utils/helpers";
import { cacheGet, cacheSet } from "../config/redis";

const router = Router();

// ─────────────────────────────────────────────────────────────
// All analytics routes require authentication
// ─────────────────────────────────────────────────────────────

router.use(authenticate);

// ─────────────────────────────────────────────────────────────
// Helper: verify URL belongs to user
// ─────────────────────────────────────────────────────────────

async function getOwnedUrl(
  urlId: string,
  userId: string
) {
  const url = await Url.findOne({
    _id: urlId,
    user: userId,
  });

  if (!url) {
    throw new AppError("URL not found", 404);
  }

  return url;
}

// ─────────────────────────────────────────────────────────────
// GET /analytics/overview
// ─────────────────────────────────────────────────────────────

router.get(
  "/overview",
  asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `analytics:overview:${req.userId}`;

    const cached = await cacheGet(cacheKey);

    if (cached) {
      return sendSuccess(
  res,
  cached as unknown,
  "Success"
);
    }

    const userUrls = (
      await Url.find({
        user: req.userId,
      }).distinct("_id")
    ).map((id) => id.toString());

    const [totalUrls, totalClicks, topUrls] =
      await Promise.all([
        Url.countDocuments({
          user: req.userId,
        }),

        Click.countDocuments({
          url: { $in: userUrls },
        }),

        Url.find({
          user: req.userId,
        })
          .sort({ clicks: -1 })
          .limit(5)
          .select(
            "originalUrl shortCode customAlias clicks title"
          ),
      ]);

    const data = {
      totalUrls,

      totalClicks,

      topUrls: topUrls.map((u) => ({
        id: u._id,
        title: u.title ?? u.originalUrl,
        shortCode: u.customAlias ?? u.shortCode,
        clicks: u.clicks,
      })),
    };

    await cacheSet(cacheKey, data, 300);

    sendSuccess(res, data);
  })
);

// ─────────────────────────────────────────────────────────────
// GET /analytics/:urlId/clicks
// ─────────────────────────────────────────────────────────────

router.get(
  "/:urlId/clicks",
  asyncHandler(async (req: Request, res: Response) => {
    await getOwnedUrl(
      req.params.urlId as string,
      req.userId! as string
    );

    const days =
      parseInt(req.query.days as string) || 30;

    const since = new Date();

    since.setDate(since.getDate() - days);

    const cacheKey = `analytics:clicks:${req.params.urlId}:${days}`;

    const cached = await cacheGet(cacheKey);

    if (cached) {
      return sendSuccess(res, cached);
    }

    const clicks = await Click.aggregate([
      {
        $match: {
          url: req.params.urlId,
          createdAt: {
            $gte: since,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },

      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    await cacheSet(cacheKey, clicks, 300);

    sendSuccess(res, clicks);
  })
);

// ─────────────────────────────────────────────────────────────
// GET /analytics/:urlId/geo
// ─────────────────────────────────────────────────────────────

router.get(
  "/:urlId/geo",
  asyncHandler(async (req: Request, res: Response) => {
    await getOwnedUrl(
      req.params.urlId as string,
      req.userId! as string
    );

    const cacheKey = `analytics:geo:${req.params.urlId}`;

    const cached = await cacheGet(cacheKey);

    if (cached) {
      return sendSuccess(res, cached);
    }

    const geo = await Click.aggregate([
      {
        $match: {
          url: req.params.urlId,
        },
      },

      {
        $group: {
          _id: "$country",
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },

      {
        $limit: 20,
      },

      {
        $project: {
          country: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    await cacheSet(cacheKey, geo, 300);

    sendSuccess(res, geo);
  })
);

// ─────────────────────────────────────────────────────────────
// GET /analytics/:urlId/devices
// ─────────────────────────────────────────────────────────────

router.get(
  "/:urlId/devices",
  asyncHandler(async (req: Request, res: Response) => {
    await getOwnedUrl(
      req.params.urlId as string,
      req.userId!
    );

    const cacheKey = `analytics:devices:${req.params.urlId}`;

    const cached = await cacheGet(cacheKey);

    if (cached) {
      return sendSuccess(res, cached);
    }

    const [devices, browsers, os] =
      await Promise.all([
        Click.aggregate([
          {
            $match: {
              url: req.params.urlId,
            },
          },

          {
            $group: {
              _id: "$device",
              count: {
                $sum: 1,
              },
            },
          },

          {
            $project: {
              name: "$_id",
              value: "$count",
              _id: 0,
            },
          },
        ]),

        Click.aggregate([
          {
            $match: {
              url: req.params.urlId,
            },
          },

          {
            $group: {
              _id: "$browser",
              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },

          {
            $limit: 6,
          },

          {
            $project: {
              name: "$_id",
              value: "$count",
              _id: 0,
            },
          },
        ]),

        Click.aggregate([
          {
            $match: {
              url: req.params.urlId,
            },
          },

          {
            $group: {
              _id: "$os",
              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },

          {
            $limit: 6,
          },

          {
            $project: {
              name: "$_id",
              value: "$count",
              _id: 0,
            },
          },
        ]),
      ]);

    const data = {
      devices,
      browsers,
      os,
    };

    await cacheSet(cacheKey, data, 300);

    sendSuccess(res, data);
  })
);

// ─────────────────────────────────────────────────────────────
// GET /analytics/:urlId/referrers
// ─────────────────────────────────────────────────────────────

router.get(
  "/:urlId/referrers",
  asyncHandler(async (req: Request, res: Response) => {
    await getOwnedUrl(
      req.params.urlId as string,
      req.userId!
    );

    const referrers = await Click.aggregate([
      {
        $match: {
          url: req.params.urlId,
        },
      },

      {
        $group: {
          _id: "$referrer",
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },

      {
        $limit: 10,
      },

      {
        $project: {
          referrer: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    sendSuccess(res, referrers);
  })
);

// ─────────────────────────────────────────────────────────────
// GET /analytics/user/clicks
// ─────────────────────────────────────────────────────────────

router.get(
  "/user/clicks",
  asyncHandler(async (req: Request, res: Response) => {
    const days =
      parseInt(req.query.days as string) || 30;

    const since = new Date();

    since.setDate(since.getDate() - days);

    const cacheKey = `analytics:user:clicks:${req.userId}:${days}`;

    const cached = await cacheGet(cacheKey);

    if (cached) {
      return sendSuccess(res, cached);
    }

    const userUrls = (
      await Url.find({
        user: req.userId,
      }).distinct("_id")
    ).map((id) => id.toString());

    const clicks = await Click.aggregate([
      {
        $match: {
          url: {
            $in: userUrls,
          },

          createdAt: {
            $gte: since,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },

      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    await cacheSet(cacheKey, clicks, 300);

    sendSuccess(res, clicks);
  })
);

export default router; 