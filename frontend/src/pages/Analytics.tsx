import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MousePointerClick, Globe, Monitor, ArrowLeft,
  ExternalLink, RefreshCw, Share2,
} from "lucide-react";
import { analyticsApi, urlApi } from "../api";
import Navbar from "../components/Navbar";
import {
  ClicksChart, DeviceChart, BrowserChart, GeoTable, StatCard,
} from "../components/Charts";
import type {
  ShortUrl, DailyClick, GeoStat, DeviceStats, ReferrerStat,
} from "../types";

export default function Analytics() {
  const { urlId } = useParams<{ urlId: string }>();

  const [urlData, setUrlData]         = useState<ShortUrl | null>(null);
  const [clicks, setClicks]           = useState<DailyClick[]>([]);
  const [geo, setGeo]                 = useState<GeoStat[]>([]);
  const [devices, setDevices]         = useState<DeviceStats | null>(null);
  const [referrers, setReferrers]     = useState<ReferrerStat[]>([]);
  const [days, setDays]               = useState(30);
  const [loading, setLoading]         = useState(true);

  const fetchAll = async () => {
    if (!urlId) return;
    setLoading(true);
    try {
      const [url, cl, geo, dev, ref] = await Promise.all([
        urlApi.getOne(urlId),
        analyticsApi.urlClicks(urlId, days),
        analyticsApi.geo(urlId),
        analyticsApi.devices(urlId),
        analyticsApi.referrers(urlId),
      ]);
      setUrlData(url);
      setClicks(cl);
      setGeo(geo);
      setDevices(dev);
      setReferrers(ref);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [urlId, days]);

  // If no urlId in params, show a message
  if (!urlId) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Share2 className="w-16 h-16 mx-auto text-gray-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Select a link to view analytics</h2>
          <p className="text-gray-400 mb-6">Go to your dashboard and click the analytics icon on any link.</p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalClicks = clicks.reduce((s, d) => s + d.count, 0);
  const topCountry  = geo[0]?.country ?? "—";
  const topDevice   = devices?.devices?.[0]?.name ?? "—";

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>

            {urlData ? (
              <>
                <h1 className="text-2xl font-bold text-white">
                  {urlData.title ?? urlData.shortCode}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <a
                    href={urlData.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 font-mono text-sm hover:underline flex items-center gap-1"
                  >
                    {urlData.shortUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className={`badge ${urlData.isActive ? "badge-green" : "badge-red"}`}>
                    {urlData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-7 bg-gray-800 rounded w-48" />
                <div className="h-4 bg-gray-800 rounded w-32" />
              </div>
            )}
          </div>

          {/* Day range selector + refresh */}
          <div className="flex items-center gap-2 shrink-0">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d
                    ? "bg-brand-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={fetchAll}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard
            label={`Clicks (${days}d)`}
            value={totalClicks}
            icon={<MousePointerClick className="w-5 h-5" />}
            sub={`${urlData?.clicks ?? 0} total all-time`}
            color="text-brand-400"
          />
          <StatCard
            label="Top Country"
            value={topCountry}
            icon={<Globe className="w-5 h-5" />}
            sub={geo[0] ? `${geo[0].count} clicks` : undefined}
            color="text-green-400"
          />
          <StatCard
            label="Top Device"
            value={topDevice}
            icon={<Monitor className="w-5 h-5" />}
            sub={devices?.devices?.[0] ? `${devices.devices[0].value} clicks` : undefined}
            color="text-purple-400"
          />
        </motion.div>

        {/* Clicks over time */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="font-semibold text-white mb-4">
            Clicks over time — last {days} days
          </h2>
          <ClicksChart data={clicks} loading={loading} />
        </motion.div>

        {/* Geo + Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-6"
          >
            <h2 className="font-semibold text-white mb-4">Top Countries</h2>
            <GeoTable data={geo} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="font-semibold text-white mb-4">Referrers</h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-800 rounded" />
                ))}
              </div>
            ) : referrers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No referrer data yet</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {referrers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-300 truncate max-w-[200px]">
                      {r.referrer === "Direct" ? (
                        <span className="text-gray-500 italic">Direct / None</span>
                      ) : (
                        r.referrer
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{r.count}</span>
                      <span className="badge badge-blue text-xs">{r.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Device + Browser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6"
          >
            <h2 className="font-semibold text-white mb-4">Device Types</h2>
            <DeviceChart data={devices} loading={loading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="font-semibold text-white mb-4">Browsers</h2>
            <BrowserChart data={devices} loading={loading} />
          </motion.div>
        </div>

        {/* Original URL */}
        {urlData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="card p-4"
          >
            <p className="text-xs text-gray-500 mb-1">Destination URL</p>
            <a
              href={urlData.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-300 hover:text-white break-all flex items-center gap-2"
            >
              {urlData.originalUrl}
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            </a>
          </motion.div>
        )}
      </main>
    </div>
  );
} 