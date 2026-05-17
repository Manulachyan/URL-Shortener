import { useState } from "react";

import { motion } from "framer-motion";

import {
  X,
  Save,
} from "lucide-react";

import type {
  ShortUrl,
} from "../types";

interface Props {
  url: ShortUrl;

  onClose: () => void;

  onSave: (
    payload: Partial<ShortUrl>
  ) => Promise<void>;
}

export default function EditUrlModal({
  url,
  onClose,
  onSave,
}: Props) {
  const [originalUrl, setOriginalUrl] =
    useState(url.originalUrl);

  const [title, setTitle] =
    useState(url.title ?? "");

  const [customAlias, setCustomAlias] =
    useState(url.customAlias ?? "");

  const [isActive, setIsActive] =
    useState(url.isActive ?? true);

  const [loading, setLoading] =
    useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      await onSave({
        originalUrl,
        title,
        customAlias,
        isActive,
      });

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}

        animate={{
          opacity: 1,
          scale: 1,
        }}

        className="card w-full max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Edit URL
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Original URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Original URL
            </label>

            <input
              type="url"
              value={originalUrl}
              onChange={(e) =>
                setOriginalUrl(
                  e.target.value
                )
              }
              className="input"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="input"
            />
          </div>

          {/* Alias */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Custom Alias
            </label>

            <input
              type="text"
              value={customAlias}
              onChange={(e) =>
                setCustomAlias(
                  e.target.value
                )
              }
              className="input"
            />
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) =>
                setIsActive(
                  e.target.checked
                )
              }
            />

            Active
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />

            {loading
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}