import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import type { ShortUrl, CreateUrlPayload } from "../types";

interface Props {
  onCreated: (url: ShortUrl) => void;
  onSubmit: (payload: CreateUrlPayload) => Promise<ShortUrl | null>;
}

export default function ShortenForm({ onCreated, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) { setError("Please enter a URL"); return; }
    try { new URL(url); } catch {
      setError("Please enter a valid URL (include https://)");
      return;
    }

    setLoading(true);
    const payload: CreateUrlPayload = {
      originalUrl: url.trim(),
      customAlias: alias.trim() || undefined,
      password: password.trim() || undefined,
      expiresAt: expiresAt || undefined,
      isOneTime,
      title: title.trim() || undefined,
    };

    const result = await onSubmit(payload);
    setLoading(false);
    if (result) {
      onCreated(result);
      setUrl(""); setAlias(""); setPassword("");
      setExpiresAt(""); setIsOneTime(false); setTitle("");
      setAdvanced(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-brand-400" />
        <h2 className="font-semibold text-white">Shorten a URL</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main URL input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-long-url.com/goes/here"
              className="input pl-10"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Shortening..." : "Shorten"}
          </button>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setAdvanced(!advanced)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          {advanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced options
        </button>

        {/* Advanced fields */}
        <AnimatePresence>
          {advanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
            >
              <div>
                <label className="label">Custom alias</label>
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2.5 bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg text-gray-400 text-sm">snip/</span>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.toLowerCase())}
                    placeholder="my-link"
                    className="input rounded-l-none"
                  />
                </div>
              </div>

              <div>
                <label className="label">Link title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My landing page"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Password protect</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for public"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Expiry date</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="input"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <span className="text-sm text-gray-300">One-time link (auto-expires after first click)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
} 