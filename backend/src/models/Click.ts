import mongoose, { Document, Schema } from "mongoose";

export interface IClick extends Document {
  url: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  // Geo
  ip: string;
  country: string;
  city: string;
  region: string;
  // Device
  browser: string;
  os: string;
  device: "mobile" | "tablet" | "desktop";
  // Referrer
  referrer: string;
  createdAt: Date;
}

const clickSchema = new Schema<IClick>(
  {
    url: {
      type: Schema.Types.ObjectId,
      ref: "Url",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    ip: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
    region: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    referrer: { type: String, default: "Direct" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// ── Indexes for analytics queries ─────────────────────────────────────────────
clickSchema.index({ url: 1, createdAt: -1 });
clickSchema.index({ url: 1, country: 1 });
clickSchema.index({ url: 1, device: 1 });
clickSchema.index({ url: 1, browser: 1 });
// Auto-delete click records after 1 year
clickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31_536_000 });

export const Click = mongoose.model<IClick>("Click", clickSchema); 