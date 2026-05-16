import mongoose, { Document, Schema } from "mongoose";

export interface IUrl extends Document {
  _id: mongoose.Types.ObjectId;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  user?: mongoose.Types.ObjectId;
  clicks: number;
  isActive: boolean;
  // Advanced features
  expiresAt?: Date;
  password?: string;
  isOneTime: boolean;
  // QR
  qrCode?: string;
  // Meta
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema = new Schema<IUrl>(
  {
    originalUrl: {
      type: String,
      required: [true, "Original URL is required"],
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customAlias: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-_]+$/, "Alias can only contain letters, numbers, hyphens, and underscores"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    clicks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    password: { type: String, select: false },
    isOneTime: { type: Boolean, default: false },
    qrCode: String,
    title: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes for fast lookups ───────────────────────────────────────────────────
urlSchema.index({ shortCode: 1 });
urlSchema.index({ customAlias: 1 });
urlSchema.index({ user: 1, createdAt: -1 });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ── Virtual: the full short URL ───────────────────────────────────────────────
urlSchema.virtual("shortUrl").get(function () {
  const code = this.customAlias ?? this.shortCode;
  return `${process.env.BASE_URL}/${code}`;
});

export const Url = mongoose.model<IUrl>("Url", urlSchema); 