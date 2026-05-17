import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, BarChart2, Shield, QrCode, Globe, Clock,
  ArrowRight, Copy, Check, ExternalLink, Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import { urlApi } from "../api";
import Navbar from "../components/Navbar";

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Lightning Fast",
    desc: "Redis-cached redirects resolve in under 5ms. Built for speed at scale.",
    color: "text-yellow-400 bg-yellow-400/10",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Deep Analytics",
    desc: "Track clicks, countries, devices, browsers and referrers in real time.",
    color: "text-blue-400 bg-blue-400/10",
  },
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "QR Codes",
    desc: "Every link gets an auto-generated QR code. Download in one click.",
    color: "text-purple-400 bg-purple-400/10",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Password Protection",
    desc: "Lock links behind a password. Control exactly who accesses your URLs.",
    color: "text-green-400 bg-green-400/10",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Custom Aliases",
    desc: "Brand your short links with memorable, custom slugs.",
    color: "text-pink-400 bg-pink-400/10",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Expiring Links",
    desc: "Set an expiry date or make links one-time-use. Full control.",
    color: "text-orange-400 bg-orange-400/10",
  },
];

const stats = [
  { value: "< 5ms", label: "Avg redirect time" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "∞", label: "Links you can create" },
  { value: "10+", label: "Analytics dimensions" },
];

export default function Landing() {
  const [inputUrl, setInputUrl] = useState("");
  const [result, setResult] = useState<{ shortUrl: string; qrCode?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    try { new URL(inputUrl); } catch {
      toast.error("Please enter a valid URL"); return;
    }
    setLoading(true);
    try {
      const data = await urlApi.create({ originalUrl: inputUrl.trim() });
      setResult({ shortUrl: data.shortUrl, qrCode: data.qrCode });
      toast.success("URL shortened!");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/20 border border-brand-600/40 text-brand-400 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Fast · Smart · Powerful
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Short links that{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                actually work
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Shorten URLs, track every click, generate QR codes, and analyze your audience —
              all in one beautifully fast platform.
            </p>
          </motion.div>

          {/* Live shortener */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleShorten} className="flex gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => { setInputUrl(e.target.value); setResult(null); }}
                  placeholder="Paste your long URL here..."
                  className="input pl-12 h-14 text-base rounded-xl"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-14 px-6 rounded-xl text-base font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Shorten
              </button>
            </form>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 card flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 font-mono font-medium hover:underline flex items-center gap-1 truncate"
                  >
                    {result.shortUrl}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
                <button onClick={copy} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5 shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </motion.div>
            )}

            <p className="text-sm text-gray-600 mt-4">
              No account required to shorten.{" "}
              <Link to="/register" className="text-brand-400 hover:underline">
                Sign up free
              </Link>{" "}
              for analytics, QR codes & more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/40 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built for developers, marketers, and teams who need more than just a short link.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 hover:border-gray-700 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center card p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10 pointer-events-none" />
          <h2 className="text-3xl font-bold text-white mb-4 relative">
            Start shortening for free
          </h2>
          <p className="text-gray-400 mb-8 relative">
            Create an account in seconds. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 py-3 px-8 text-base">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 py-3 px-8 text-base">
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-brand-600 rounded flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-400">Snip</span>
        </div>
        <p>Built with Node.js, React, MongoDB & Redis · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
} 