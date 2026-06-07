"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAdminTenant } from "@/components/admin/useAdminTenant";
import ImageUploadModal from "@/components/ImageUploadModal";

type ProductForm = {
  id: string;
  name: string;
  stockKg: number;
  stockStatus: "Ready" | "Menipis";
  imageUrl: string;
  pricePerKg: number;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

const initialForm: ProductForm = {
  id: "",
  name: "",
  stockKg: 0,
  stockStatus: "Ready",
  imageUrl: "",
  pricePerKg: 15000,
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { ready, session, catalog } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ProductForm[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedProductId, setLastSavedProductId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function readResponseError(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return typeof payload?.error === "string" ? payload.error : JSON.stringify(payload);
    }

    return await response.text();
  }

  function addToast(message: string, type: "success" | "error" | "info" = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products?tenantId=${session.tenantId}`, {
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        const errorBody = isJson ? await response.json() : await response.text();
        console.error("Fetch products error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        const message =
          isJson && errorBody && typeof errorBody === "object" && "error" in errorBody
            ? String(errorBody.error)
            : `Gagal mengambil daftar produk (${response.status})`;
        addToast(message, "error");
        return;
      }

      const data = isJson ? await response.json() : null;
      setItems(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error("Fetch error:", error);
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    fetchProducts();
  }, [ready, session, router, fetchProducts]);

  const lowStockCount = useMemo(() => {
    return items.filter((item) => item.stockStatus === "Menipis").length;
  }, [items]);

  const dynamicSubtitle = useMemo(() => {
    if (!catalog?.name) {
      return "Kelola stok & harga produk pertanian";
    }
    return `Kelola stok & harga ${catalog.name}`;
  }, [catalog?.name]);

  const productProgress = useMemo(() => {
    const checks = [
      form.name.trim().length >= 3,
      form.stockKg > 0,
      form.pricePerKg > 0,
      Boolean(form.imageUrl),
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form.imageUrl, form.name, form.pricePerKg, form.stockKg]);

  function getProgressWidthClass(progress: number) {
    if (progress <= 0) return "w-0";
    if (progress <= 25) return "w-1/4";
    if (progress <= 50) return "w-1/2";
    if (progress <= 75) return "w-3/4";
    return "w-full";
  }

  function handleImageUpload(imageUrl: string) {
    setForm((prev) => ({ ...prev, imageUrl }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!session) {
      return;
    }

    if (form.name.trim().length < 3) {
      setError("Nama produk minimal 3 karakter.");
      return;
    }

    if (form.stockKg < 0) {
      setError("Stok tidak boleh negatif.");
      return;
    }

    try {
      setIsLoading(true);

      // Determine if we're creating or updating
      const isCreate = !form.id;
      const endpoint = isCreate
        ? "/api/admin/products"
        : `/api/admin/products/${form.id}`;
      const method = isCreate ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-farmer-id": session.tenantId,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          stockKg: Number(form.stockKg),
          pricePerKg: Number(form.pricePerKg),
          imageUrl: form.imageUrl,
        }),
      });

      if (!response.ok) {
        const errorMessage = await readResponseError(response);
        throw new Error(errorMessage || `Gagal menyimpan produk (${response.status})`);
      }

      const data = await response.json();
      addToast(data.message || "Produk berhasil disimpan", "success");
      setLastSavedProductId(data?.data?.id ?? form.id ?? null);

      // Refresh products list
      await fetchProducts();
      setForm(initialForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan produk";
      setError(message);
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(item: ProductForm) {
    setForm({
      id: item.id,
      name: item.name,
      stockKg: item.stockKg,
      stockStatus: item.stockStatus,
      imageUrl: item.imageUrl,
      pricePerKg: item.pricePerKg ?? 15000,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(itemId: string) {
    if (!session) {
      return;
    }

    if (!confirm("Yakin ingin menghapus produk ini?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products/${itemId}`, {
        method: "DELETE",
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      if (!response.ok) {
        const errorMessage = await readResponseError(response);
        throw new Error(errorMessage || `Gagal hapus produk (${response.status})`);
      }

      const data = await response.json();
      addToast(data.message || "Produk berhasil dihapus", "success");

      // Refresh products list
      await fetchProducts();
      if (form.id === itemId) {
        setForm(initialForm);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal hapus produk";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/60 bg-white/35 px-6 py-10 shadow-[0_24px_60px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div className="relative flex flex-col items-center gap-4 rounded-4xl border border-cyan-200/70 bg-white/55 px-8 py-10 text-center shadow-[0_18px_40px_rgba(2,132,199,0.12)] backdrop-blur-lg">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="space-y-2">
            <div className="mx-auto h-4 w-56 animate-pulse rounded-full bg-cyan-100/80" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-sky-100/80" />
          </div>
          <p className="text-sm font-medium text-slate-600">Menyiapkan katalog Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <main className="space-y-6">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition ${
                toast.type === "success"
                  ? "bg-emerald-500"
                  : toast.type === "error"
                    ? "bg-rose-500"
                    : "bg-cyan-500"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Kelola Produk</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Inventaris Produk</h1>
        <p className="mt-1 text-sm text-slate-500">{dynamicSubtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Total Produk</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{items.length}</p>
        </article>
        <article className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Stok Menipis</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{lowStockCount}</p>
        </article>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="mb-6 text-lg font-bold text-slate-900">
          {form.id ? "Edit Produk" : "Tambah Produk Baru"}
        </h2>

        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Progress form produk</span>
            <span className="font-semibold text-cyan-700">{productProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-cyan-100">
            <div className={`h-2 rounded-full bg-cyan-600 transition-all ${getProgressWidthClass(productProgress)}`} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Nama Produk</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Nama produk..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Stok (kg)</span>
              <input
                type="number"
                value={form.stockKg}
                onChange={(e) => setForm((prev) => ({ ...prev, stockKg: Number(e.target.value) }))}
                min="0"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="0"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Harga per Kg</span>
              <input
                type="number"
                value={form.pricePerKg}
                onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: Number(e.target.value) }))}
                min="0"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="15000"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Status Stok</span>
              <select
                value={form.stockStatus}
                onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value as "Ready" | "Menipis" }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="Ready">Ready</option>
                <option value="Menipis">Menipis</option>
              </select>
            </label>
          </div>

          <div>
            <span className="text-sm font-semibold text-slate-700">Foto Produk</span>
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="mt-2 inline-block rounded-lg bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition"
            >
              {form.imageUrl ? "Ubah Foto" : "Pilih Foto"}
            </button>

            {form.imageUrl && (
              <div className="mt-3 space-y-2">
                <div className="overflow-hidden rounded-xl border border-cyan-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Preview produk" className="h-36 w-full object-cover" />
                </div>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                  {lastSavedProductId && lastSavedProductId === form.id ? "Foto produk tersimpan di database." : "Foto produk siap disimpan saat klik tombol simpan."}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-linear-to-r from-cyan-500 to-cyan-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {/* Products Grid */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Daftar Produk {isLoading && "• Memuat..."}</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">
            <p className="text-slate-500">Belum ada produk. Tambahkan produk baru untuk memulai.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-sm backdrop-blur-sm transition hover:bg-white/65"
              >
                <Image
                  src={item.imageUrl || "/image/gambar13.jpg"}
                  alt={item.name}
                  width={300}
                  height={150}
                  className="h-40 w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  unoptimized={Boolean(item.imageUrl?.startsWith("data:"))}
                />
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-600">{item.stockKg.toLocaleString("id-ID")} kg</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-700">
                      Rp {Number(item.pricePerKg ?? 15000).toLocaleString("id-ID")} / kg
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                    {lastSavedProductId === item.id ? "Baru saja tersimpan di database." : "Data produk tersimpan di database."}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stockStatus === "Ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.stockStatus}
                  </span>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={isLoading}
                      className="flex-1 rounded-lg border border-cyan-200 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading}
                      className="flex-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ImageUploadModal
        isOpen={isImageModalOpen}
        title="Pilih Foto Produk"
        initialImage={form.imageUrl}
        onClose={() => setIsImageModalOpen(false)}
        onConfirm={handleImageUpload}
      />
    </main>
  );
}
