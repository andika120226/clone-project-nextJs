"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AdminProduct,
  deleteTenantProduct,
  getTenantProducts,
  isImageFileExtensionAllowed,
  isImageMimeAllowed,
  saveTenantProduct,
} from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

type ProductForm = {
  id: string;
  name: string;
  stockKg: number;
  stockStatus: "Ready" | "Menipis";
  imageUrl: string;
};

const initialForm: ProductForm = {
  id: "",
  name: "",
  stockKg: 0,
  stockStatus: "Ready",
  imageUrl: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();


  const [form, setForm] = useState<ProductForm>(initialForm);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminProduct[]>([]);
  // eslint-disable react-hooks/rules-of-hooks
  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    setItems(getTenantProducts(session.tenantId));
  }, [ready, session, router]);

  const lowStockCount = useMemo(() => {
    return items.filter((item) => item.stockStatus === "Menipis").length;
  }, [items]);

  function readAsDataUrl(file: File, callback: (value: string) => void) {
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const mime = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!isImageMimeAllowed(mime)) {
      setError(`MIME type ${mime} tidak diizinkan. Gunakan JPG, PNG, atau WebP.`);
      return;
    }

    if (!isImageFileExtensionAllowed(ext)) {
      setError(`Ekstensi .${ext} tidak diizinkan. Gunakan .jpg, .png, atau .webp`);
      return;
    }

    setError("");
    readAsDataUrl(file, (value) => setForm((prev) => ({ ...prev, imageUrl: value })));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    saveTenantProduct(session.tenantId, {
      id: form.id,
      name: form.name.trim(),
      stockKg: Number(form.stockKg),
      stockStatus: form.stockStatus,
      imageUrl: form.imageUrl,
    });

    setItems(getTenantProducts(session.tenantId));
    setForm(initialForm);
  }

  function handleEdit(item: AdminProduct) {
    setForm({
      id: item.id,
      name: item.name,
      stockKg: item.stockKg,
      stockStatus: item.stockStatus,
      imageUrl: item.imageUrl,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(itemId: string) {
    if (!session) {
      return;
    }

    deleteTenantProduct(session.tenantId, itemId);
    setItems(getTenantProducts(session.tenantId));
    if (form.id === itemId) {
      setForm(initialForm);
    }
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Kelola Produk</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Inventaris Produk</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola stok & harga syzen coffee</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Total Produk</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{items.length}</p>
        </article>
        <article className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Stok Habis</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{lowStockCount}</p>
        </article>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="mb-6 text-lg font-bold text-slate-900">
          {form.id ? "Edit Produk" : "Tambah Produk Baru"}
        </h2>

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
            <label className="mt-2 block">
              <span className="text-xs text-slate-600">Upload Foto (JPG, PNG, WebP)</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleUpload} className="mt-2 w-full" />
            </label>

            {form.imageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-cyan-100 bg-white">
                <Image src={form.imageUrl} alt="Preview produk" width={200} height={140} className="h-36 w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            {form.id ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {/* Products Grid */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Daftar Produk</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">
            <p className="text-slate-500">Belum ada produk. Tambahkan produk baru untuk memulai.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-sm backdrop-blur-sm transition hover:bg-white/65">
                <Image
                  src={item.imageUrl || "/image/gambar13.jpg"}
                  alt={item.name}
                  width={300}
                  height={150}
                  className="h-40 w-full object-cover"
                />
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-600">{item.stockKg.toLocaleString("id-ID")} kg</p>
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
                      className="flex-1 rounded-lg border border-cyan-200 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
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
    </main>
  );
}
