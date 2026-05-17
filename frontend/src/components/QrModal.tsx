import { motion } from "framer-motion";
import { X, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { ShortUrl } from "../types";

interface Props {
  url: ShortUrl;
  onClose: () => void;
}

export default function QrModal({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const downloadQr = () => {
    if (!url.qrCode) return;
    const link = document.createElement("a");
    link.href = url.qrCode;
    link.download = `qr-${url.shortCode}.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-sm p-6 shadow-2xl text-center"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {url.qrCode ? (
          <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-4">
            <img src={url.qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-sm">
            No QR generated
          </div>
        )}

        <p className="text-gray-400 text-sm mb-1 truncate font-mono">
          {url.shortUrl}
        </p>
        {url.title && <p className="text-gray-500 text-xs mb-4">{url.title}</p>}

        <div className="flex gap-3">
          <button onClick={copyLink} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            Copy link
          </button>
          <button onClick={downloadQr} disabled={!url.qrCode} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </motion.div>
    </div>
  );
} 