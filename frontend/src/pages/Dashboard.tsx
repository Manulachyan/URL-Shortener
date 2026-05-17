import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link2, MousePointerClick, TrendingUp, Copy } from "lucide-react";
import { useAuthStore } from "../store";
import { analyticsApi } from "../api";
import { useUrls } from "../hooks/useUrls";
import Navbar from "../components/Navbar";
import ShortenForm from "../components/ShortenForm";
import UrlTable from "../components/UrlTable";
import { StatCard, ClicksChart } from "../components/Charts";
import type { OverviewStats, DailyClick, ShortUrl } from "../types";

export default function Dashboard() {
  const { user } = useAuthStore();
  const {
    urls, loading, page, totalPages, search,
    setPage, setSearch, createUrl, updateUrl, deleteUrl,
  } = useUrls();

  const [stats, setStats]           = useState<OverviewStats | null>(null);
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([]);
  const [lastCreated, setLastCreated] = useState<ShortUrl | null>(null);

  useEffect(() => {
    analyticsApi.overview().then(setStats).catch(() => {});
    analyticsApi.userClicks(30).then(setDailyClicks).catch(() => {});
  }, []);

  const handleCreated = (url: ShortUrl) => {
    setLastCreated(url);
    analyticsApi.overview().then(setStats).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">
            Good to see you, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your links and track performance
          </p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard
            label="Total Links"
            value={stats?.totalUrls ?? 0}
            icon={<Link2 className="w-5 h-5" />}
            color="text-brand-400"
          />
          <StatCard
            label="Total Clicks"
            value={stats?.totalClicks ?? 0}
            icon={<MousePointerClick className="w-5 h-5" />}
            color="text-purple-400"
          />
          <StatCard
            label="Top Link Clicks"
            value={stats?.topUrls?.[0]?.clicks ?? 0}
            icon={<TrendingUp className="w-5 h-5" />}
            sub={stats?.topUrls?.[0]?.title ?? stats?.topUrls?.[0]?.shortCode ?? "—"}
            color="text-green-400"
          />
        </motion.div>

        {/* Clicks chart */}
        {dailyClicks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-6"
          >
            <h2 className="font-semibold text-white mb-4">Clicks — last 30 days</h2>
            <ClicksChart data={dailyClicks} />
          </motion.div>
        )}

        {/* Shorten form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ShortenForm onSubmit={createUrl} onCreated={handleCreated} />
        </motion.div>

        {/* Newly created banner */}
        {lastCreated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-4 border-brand-700 bg-brand-900/20 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-xs text-brand-400 font-medium mb-0.5">Link created!</p>
              <p className="text-white font-mono text-sm truncate">{lastCreated.shortUrl}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastCreated.shortUrl);
              }}
              className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </motion.div>
        )}

        {/* URL table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Your Links</h2>
            <span className="text-sm text-gray-500">{stats?.totalUrls ?? 0} total</span>
          </div>
          <UrlTable
            urls={urls}
            loading={loading}
            page={page}
            totalPages={totalPages}
            search={search}
            onSearch={(s) => { setSearch(s); setPage(1); }}
            onPageChange={setPage}
            onUpdate={updateUrl}
            onDelete={deleteUrl}
          />
        </motion.div>
      </main>
    </div>
  );
} 