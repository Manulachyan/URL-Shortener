import axios from "axios";
import type {
  AuthResponse,
  CreateUrlPayload,
  UpdateUrlPayload,
  PaginatedUrls,
  ShortUrl,
  OverviewStats,
  DailyClick,
  GeoStat,
  DeviceStats,
  ReferrerStat,
  AdminStats,
  AdminUser,
  AdminUrl,
  ApiResponse,
} from "./types";

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? "/api/v1"}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Helper ────────────────────────────────────────────────────────────────────
const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (name: string, email: string, password: string) =>
    unwrap<AuthResponse>(api.post("/auth/register", { name, email, password })),

  login: (email: string, password: string) =>
    unwrap<AuthResponse>(api.post("/auth/login", { email, password })),

  refresh: (refreshToken: string) =>
    unwrap<{ accessToken: string; refreshToken: string }>(
      api.post("/auth/refresh", { refreshToken })
    ),

  me: () => unwrap<AuthResponse["user"]>(api.get("/auth/me")),

  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap<null>(api.patch("/auth/change-password", { currentPassword, newPassword })),
};

// ── URL API ───────────────────────────────────────────────────────────────────

export const urlApi = {
  create: (payload: CreateUrlPayload) =>
    unwrap<ShortUrl>(api.post("/urls", payload)),

  list: (page = 1, limit = 10, search = "") =>
    unwrap<PaginatedUrls>(
      api.get("/urls", { params: { page, limit, search } })
    ),

  getOne: (id: string) => unwrap<ShortUrl>(api.get(`/urls/${id}`)),

  update: (id: string, payload: UpdateUrlPayload) =>
    unwrap<ShortUrl>(api.patch(`/urls/${id}`, payload)),

  delete: (id: string) => unwrap<null>(api.delete(`/urls/${id}`)),

  getQr: (id: string) =>
    unwrap<{ qrCode: string }>(api.get(`/urls/${id}/qr`)),
};

// ── Analytics API ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => unwrap<OverviewStats>(api.get("/analytics/overview")),

  userClicks: (days = 30) =>
    unwrap<DailyClick[]>(api.get("/analytics/user/clicks", { params: { days } })),

  urlClicks: (urlId: string, days = 30) =>
    unwrap<DailyClick[]>(
      api.get(`/analytics/${urlId}/clicks`, { params: { days } })
    ),

  geo: (urlId: string) =>
    unwrap<GeoStat[]>(api.get(`/analytics/${urlId}/geo`)),

  devices: (urlId: string) =>
    unwrap<DeviceStats>(api.get(`/analytics/${urlId}/devices`)),

  referrers: (urlId: string) =>
    unwrap<ReferrerStat[]>(api.get(`/analytics/${urlId}/referrers`)),
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => unwrap<AdminStats>(api.get("/admin/stats")),

  users: (page = 1, search = "") =>
    unwrap<{ users: AdminUser[]; pagination: any }>(
      api.get("/admin/users", { params: { page, search } })
    ),

  toggleUser: (id: string) =>
    unwrap<{ isActive: boolean }>(api.patch(`/admin/users/${id}/toggle`)),

  deleteUser: (id: string) => unwrap<null>(api.delete(`/admin/users/${id}`)),

  updateRole: (id: string, role: "user" | "admin") =>
    unwrap<AdminUser>(api.patch(`/admin/users/${id}/role`, { role })),

  urls: (page = 1, search = "") =>
    unwrap<{ urls: AdminUrl[]; pagination: any }>(
      api.get("/admin/urls", { params: { page, search } })
    ),

  toggleUrl: (id: string) =>
    unwrap<{ isActive: boolean }>(api.patch(`/admin/urls/${id}/toggle`)),

  deleteUrl: (id: string) => unwrap<null>(api.delete(`/admin/urls/${id}`)),
};

export default api; 