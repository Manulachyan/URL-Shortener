import mongoose, {
  Document,
  Schema,
  HydratedDocument,
} from "mongoose";

import bcrypt from "bcryptjs";

import { env } from "../config/env";

// ─────────────────────────────────────────────────────────────
// User Interface
// ─────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;

  name: string;

  email: string;

  password?: string;

  role: "user" | "admin";

  apiKey?: string;

  apiUsage: number;

  apiLimit: number;

  googleId?: string;

  avatar?: string;

  isVerified: boolean;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
}
// Schema

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      minlength: [
        6,
        "Password must be at least 6 characters",
      ],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    apiUsage: {
      type: Number,
      default: 0,
    },

    apiLimit: {
      type: Number,
      default: 1000,
    },

    googleId: {
      type: String,
      sparse: true,
    },

    avatar: String,

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


// Indexes

userSchema.index({ email: 1 });

userSchema.index({ apiKey: 1 });

userSchema.index({ googleId: 1 });

// Password Hash Middleware

userSchema.pre(
  "save",
  async function (
    this: HydratedDocument<IUser>
  ): Promise<void> {
    if (
      !this.isModified("password") ||
      !this.password
    ) {
      return;
    }

    const rounds = parseInt(
      env.BCRYPT_ROUNDS,
      10
    );

    this.password = await bcrypt.hash(
      this.password,
      rounds
    );
  }
);

// Compare Password Method
userSchema.methods.comparePassword =
  async function (
    candidate: string
  ): Promise<boolean> {
    if (!this.password) {
      return false;
    }

    return bcrypt.compare(
      candidate,
      this.password
    );
  };


export const User = mongoose.model<IUser>(
  "User",
  userSchema
);