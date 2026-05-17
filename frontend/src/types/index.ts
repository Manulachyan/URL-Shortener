// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  apiKey?: string;
  apiUsage: number;
  apiLimit: number;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── URL ───────────────────────────────────────────────────────────────────────

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customAlias?: string;
  title?: string;
  clicks: number;
  isActive: boolean;
  expiresAt?: string;
  isOneTime: boolean;
  qrCode?: string;
  createdAt: string;
}

export interface CreateUrlPayload {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
  password?: string;
  isOneTime?: boolean;
  title?: string;
}

export interface UpdateUrlPayload {
  originalUrl?: string;
  customAlias?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  title?: string;
}

export interface PaginatedUrls {
  urls: ShortUrl[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalUrls: number;
  totalClicks: number;
  topUrls: { id: string; title: string; shortCode: string; clicks: number }[];
}

export interface DailyClick {
  date: string;
  count: number;
}

export interface GeoStat {
  country: string;
  count: number;
}

export interface DeviceStats {
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  os: { name: string; value: number }[];
}

export interface ReferrerStat {
  referrer: string;
  count: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  newUsers: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
  apiUsage: number;
  apiLimit: number;
  createdAt: string;
}

export interface AdminUrl {
  _id: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  clicks: number;
  isActive: boolean;
  user?: { name: string; email: string };
  createdAt: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
} 