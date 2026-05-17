import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Link2, MousePointerClick, Activity,
  Search, Trash2, Shield, ShieldOff, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, UserCog,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../api";
import Navbar from "../components/Navbar";
import { StatCard } from "../components/Charts";
import type { AdminStats, AdminUser, AdminUrl } from "../types";
import { format } from "date-fns";

type Tab = "users" | "urls";

export default function Admin() {
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [tab, setTab]           = useState<Tab>("users");

  // Users
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);

  // URLs
  const [urls, setUrls]         = useState<AdminUrl[]>([]);
  const [urlPage, setUrlPage]   = useState(1);
  const [urlTotal, setUrlTotal] = useState(0);
  const [urlSearch, setUrlSearch] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "users") return;
    setUserLoading(true);
    adminApi.users(userPage, userSearch)
      .then((d) => { setUsers(d.users); setUserTotal(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setUserLoading(false));
  }, [tab, userPage, userSearch]);

  useEffect(() => {
    if (tab !== "urls") return;
    setUrlLoading(true);
    adminApi.urls(urlPage, urlSearch)
      .then((d) => { setUrls(d.urls); setUrlTotal(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load URLs"))
      .finally(() => setUrlLoading(false));
  }, [tab, urlPage, urlSearch]);

  const toggleUser = async (id: string) => {
    try {
      const res = await adminApi.toggleUser(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: res.isActive } : u));
      toast.success(res.isActive ? "User activated" : "User deactivated");
    } catch { toast.error("Failed to update user"); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user and ALL their data? This cannot be undone.")) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch { toast.error("Failed to delete user"); }
  };

  const toggleUrl = async (id: string) => {
    try {
      const res = await adminApi.toggleUrl(id);
      setUrls((prev) => prev.map((u) => u._id === id ? { ...u, isActive: res.isActive } : u));
      toast.success(res.isActive ? "URL activated" : "URL deactivated");
    } catch { toast.error("Failed to update URL"); }
  };

  const deleteUrl = async (id: string) => {
    if (!confirm("Delete this URL permanently?")) return;
    try {
      await adminApi.deleteUrl(id);
      setUrls((prev) => prev.filter((u) => u._id !== id));
      toast.success("URL deleted");
    } catch { toast.error("Failed to delete URL"); }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-400 text-sm">Manage users, URLs and system health</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <StatCard label="Total Users"  value={stats?.totalUsers  ?? 0} icon={<Users className="w-5 h-5" />}              color="text-brand-400" />
          <StatCard label="Total Links"  value={stats?.totalUrls   ?? 0} icon={<Link2 className="w-5 h-5" />}              color="text-purple-400" />
          <StatCard label="Total Clicks" value={stats?.totalClicks ?? 0} icon={<MousePointerClick className="w-5 h-5" />}  color="text-green-400" />
          <StatCard label="New Users (7d)" value={stats?.newUsers  ?? 0} icon={<Activity className="w-5 h-5" />}           color="text-yellow-400" />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-900 rounded-xl w-fit border border-gray-800">
          {(["users", "urls"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Users table */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search by name or email..."
                  className="input pl-9 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">User</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Role</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Joined</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {userLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">No users found</td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.name}</p>
                            <p className="text-gray-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === "admin" ? "badge-blue" : "badge-yellow"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleUser(u._id)}
                            title={u.isActive ? "Deactivate" : "Activate"}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-900/20 transition-colors"
                          >
                            {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteUser(u._id)}
                            title="Delete user"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userTotal > 1 && (
              <div className="p-4 border-t border-gray-800 flex justify-center gap-2">
                <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 flex items-center px-3">
                  Page {userPage} of {userTotal}
                </span>
                <button onClick={() => setUserPage(p => Math.min(userTotal, p + 1))} disabled={userPage === userTotal} className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* URLs table */}
        {tab === "urls" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={urlSearch}
                  onChange={(e) => { setUrlSearch(e.target.value); setUrlPage(1); }}
                  placeholder="Search URLs..."
                  className="input pl-9 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">URL</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Owner</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Clicks</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {urlLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                        </td>
                      </tr>
                    ))
                  ) : urls.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">No URLs found</td>
                    </tr>
                  ) : urls.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-brand-400 font-mono text-sm">{u.shortCode}</p>
                        <p className="text-gray-500 text-xs truncate">{u.originalUrl}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.user ? (
                          <div>
                            <p className="text-gray-300">{u.user.name}</p>
                            <p>{u.user.email}</p>
                          </div>
                        ) : <span className="italic">Anonymous</span>}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{u.clicks}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleUrl(u._id)}
                            title="Toggle status"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-900/20 transition-colors"
                          >
                            {u.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteUrl(u._id)}
                            title="Delete URL"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {urlTotal > 1 && (
              <div className="p-4 border-t border-gray-800 flex justify-center gap-2">
                <button onClick={() => setUrlPage(p => Math.max(1, p - 1))} disabled={urlPage === 1} className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 flex items-center px-3">
                  Page {urlPage} of {urlTotal}
                </span>
                <button onClick={() => setUrlPage(p => Math.min(urlTotal, p + 1))} disabled={urlPage === urlTotal} className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
} 