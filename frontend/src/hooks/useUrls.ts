import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { urlApi } from "../api";
import type { ShortUrl, CreateUrlPayload, UpdateUrlPayload } from "../types";

export const useUrls = () => {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await urlApi.list(page, 10, search);
      setUrls(data.urls);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error("Failed to load URLs");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const createUrl = async (payload: CreateUrlPayload): Promise<ShortUrl | null> => {
    try {
      const newUrl = await urlApi.create(payload);
      toast.success("URL shortened!");
      await fetchUrls();
      return newUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to shorten URL");
      return null;
    }
  };

  const updateUrl = async (id: string, payload: UpdateUrlPayload) => {
    try {
      await urlApi.update(id, payload);
      toast.success("URL updated");
      await fetchUrls();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Update failed");
    }
  };

  const deleteUrl = async (id: string) => {
    try {
      await urlApi.delete(id);
      toast.success("URL deleted");
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  return {
    urls,
    loading,
    page,
    totalPages,
    search,
    setPage,
    setSearch,
    createUrl,
    updateUrl,
    deleteUrl,
    refresh: fetchUrls,
  };
}; 