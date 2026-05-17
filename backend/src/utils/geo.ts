import geoip from "geoip-lite";
import { Request } from "express";

export interface GeoInfo {
  country: string;
  city: string;
  region: string;
}

/** Extract real client IP, handling proxies and Docker networking */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "127.0.0.1";
};

/** Lookup country/city from IP */
export const getGeoInfo = (ip: string): GeoInfo => {
  // Skip lookup for local/private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return { country: "Local", city: "Local", region: "Local" };
  }

  const geo = geoip.lookup(ip);
  return {
    country: geo?.country ?? "Unknown",
    city: geo?.city ?? "Unknown",
    region: geo?.region ?? "Unknown",
  };
}; 