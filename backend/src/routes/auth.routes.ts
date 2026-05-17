import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../middleware/error";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendSuccess, sendError, AppError } from "../utils/helpers";
import { generateToken } from "../utils/nanoid";
import { env } from "../config/env";

const router = Router();

// ── Validators ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const issueTokens = (userId: string, role: "user" | "admin") => ({
  accessToken: signAccessToken({ userId, role }),
  refreshToken: signRefreshToken({ userId, role }),
});

// ── POST /api/v1/auth/register ─────────────────────────────────────────────

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("Email already registered", 409);

    const user = await User.create({
      name,
      email,
      password,
      apiKey: generateToken(),
      isVerified: true, // skip email flow for now
    });

    const tokens = issueTokens(user._id.toString(), user.role);

    sendSuccess(
      res,
      {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        ...tokens,
      },
      "Account created successfully",
      201
    );
  })
);

// ── POST /api/v1/auth/login ────────────────────────────────────────────────

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new AppError("Invalid email or password", 401);

    if (!user.isActive) throw new AppError("Account has been deactivated", 403);

    const valid = await user.comparePassword(password);
    if (!valid) throw new AppError("Invalid email or password", 401);

    const tokens = issueTokens(user._id.toString(), user.role);

    sendSuccess(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      ...tokens,
    });
  })
);

// ── POST /api/v1/auth/refresh ──────────────────────────────────────────────

router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    const user = await User.findById(payload.userId).select("isActive role");
    if (!user || !user.isActive) throw new AppError("User not found", 401);

    const tokens = issueTokens(user._id.toString(), user.role);
    sendSuccess(res, tokens, "Tokens refreshed");
  })
);

// ── GET /api/v1/auth/me ────────────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId).select(
      "-__v -googleId"
    );
    if (!user) throw new AppError("User not found", 404);
    sendSuccess(res, user);
  })
);

// ── PATCH /api/v1/auth/change-password ────────────────────────────────────

const changePwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

router.patch(
  "/change-password",
  authenticate,
  validate(changePwSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select("+password");
    if (!user) throw new AppError("User not found", 404);

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new AppError("Current password is incorrect", 400);

    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, "Password changed successfully");
  })
);

export default router; 