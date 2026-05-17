import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Pencil, Trash2, QrCode, BarChart2,
  ExternalLink, Search, ChevronLeft, ChevronRight, Link2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { ShortUrl } from "../types";
import EditUrlModal from "./EditUrlModal";
import QrModal from "./QrModal";

interface Props {
  urls: ShortUrl[];
  loading: boolean;
  page: number;
  totalPages: number;
  search: string;
  onSearch: (s: string) => void;
  onPageChange: (p: number) => void;
  onUpdate: (id: string, payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function UrlTable({
  urls, loading, page, totalPages,
  search, onSearch, onPageChange, onUpdate, onDelete,
}: Props) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<ShortUrl | null>(null);
  const [qrUrl, setQrUrl] = useState<ShortUrl | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success("Copied!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const truncate = (str: string, n: number) =>
    str.length > n ? str.slice(0, n) + "…" : str;

  return (
    <div className="card overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search URLs, aliases, titles..."
            className="input pl-9 text-sm"
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {totalPages > 0 ? `Page ${page} of ${totalPages}` : "No results"}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="divide-y divide-gray-800">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse flex gap-4">
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-800 rounded w-1/4" />
              <div className="h-4 bg-gray-800 rounded w-16 ml-auto" />
            </div>
          ))}
        </div>
      ) : urls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Link2 className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No URLs yet</p>
          <p className="text-sm mt-1">Shorten your first link above</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="divide-y divide-gray-800">
            {urls.map((url, i) => (
              <motion.div
                key={url.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* URL info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {url.title && (
                        <span className="text-sm font-medium text-white truncate">
                          {url.title}
                        </span>
                      )}
                      <span className={`badge ${url.isActive ? "badge-green" : "badge-red"}`}>
                        {url.isActive ? "Active" : "Inactive"}
                      </span>
                      {url.isOneTime && <span className="badge badge-yellow">One-time</span>}
                      {url.expiresAt && <span className="badge badge-blue">Expires</span>}
                    </div>

                    {/* Short URL */}
                    <div className="flex items-center gap-2">
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 font-mono text-sm font-medium flex items-center gap-1"
                      >
                        {url.shortUrl.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(url.shortUrl, url.id)}
                        className="text-gray-500 hover:text-gray-200 transition-colors"
                      >
                        {copiedId === url.id
                          ? <Check className="w-3.5 h-3.5 text-green-400" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Original URL */}
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {truncate(url.originalUrl, 70)}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>{url.clicks} clicks</span>
                      <span>·</span>
                      <span>{format(
  new Date(url.createdAt ?? ""),
  "MMM d, yyyy"
)}</span>
                      {url.expiresAt && (
                        <>
                          <span>·</span>
                          <span className="text-yellow-600">
                            Expires {format(new Date(url.expiresAt), "MMM d")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <ActionBtn
                      onClick={() => navigate(`/analytics/${url.id}`)}
                      icon={<BarChart2 className="w-4 h-4" />}
                      title="Analytics"
                    />
                    <ActionBtn
                      onClick={() => setQrUrl(url)}
                      icon={<QrCode className="w-4 h-4" />}
                      title="QR Code"
                    />
                    <ActionBtn
                      onClick={() => setEditUrl(url)}
                      icon={<Pencil className="w-4 h-4" />}
                      title="Edit"
                    />
                    <ActionBtn
                      onClick={() => handleDelete(url.id)}
                      icon={<Trash2 className="w-4 h-4" />}
                      title="Delete"
                      danger
                      loading={deletingId === url.id}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                page === i + 1
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {editUrl && (
        <EditUrlModal
          url={editUrl}
          onClose={() => setEditUrl(null)}
          onSave={async (
  payload: Partial<ShortUrl>
) => {
  await onUpdate(
    editUrl.id,
    payload
  );

  setEditUrl(null);
}} 
        />
      )}
      {qrUrl && <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  );
}

function ActionBtn({
  onClick, icon, title, danger = false, loading = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        danger
          ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20"
          : "text-gray-500 hover:text-gray-200 hover:bg-gray-700"
      }`}
    >
      {icon}
    </button>
  );
}