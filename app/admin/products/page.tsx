"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  id?: string;
  name: string;
  stockKg: number;
  stockStatus: "Ready" | "Menipis";
  imageUrl: string;
};

const initialForm: ProductForm = {
  name: "",
  stockKg: 0,
  stockStatus: "Ready",
  imageUrl: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getTenantProducts(session.tenantId));
  }, [ready, router, session]);

  const lowStockCount = useMemo(
    () => items.filter((item) => item.stockStatus === "Menipis").length,
    [items],
  );

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isImageMimeAllowed(file.type) || !isImageFileExtensionAllowed(file.name)) {
      setError("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imageUrl: String(reader.result ?? "") }));
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
  }

  function handleDelete(itemId: string) {
    if (!session) {
      return;
    }

    const next = deleteTenantProduct(session.tenantId, itemId);
    setItems(next);
    if (form.id === itemId) {
      setForm(initialForm);
    }
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Katalog Produk</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">CRUD Produk Tenant</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola nama produk, stok (Ready/Menipis), dan upload foto JPG/PNG/WebP.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/80 bg-white/65 p-5">
          <h2 className="text-lg font-semibold text-slate-900">{form.id ? "Edit Produk" : "Tambah Produk"}</h2>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm text-slate-700">Nama Produk</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-700">Stok (kg)</span>
              <input
                type="number"
                min={0}
                value={form.stockKg}
                onChange={(event) => setForm((prev) => ({ ...prev, stockKg: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-700">Status Stok</span>
              <select
                value={form.stockStatus}
                onChange={(event) => setForm((prev) => ({ ...prev, stockStatus: event.target.value as "Ready" | "Menipis" }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5"
              >
                <option value="Ready">Ready</option>
                <option value="Menipis">Menipis</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-slate-700">Upload Foto (JPG, PNG, WebP)</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleUpload} className="mt-1 w-full" />
            </label>

            {form.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
                <img src={form.imageUrl} alt="Preview produk" className="h-44 w-full object-cover" />
              </div>
            )}

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex gap-2">
              <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2.5 font-semibold text-white">
                {form.id ? "Simpan Perubahan" : "Tambah Produk"}
              </button>
              {form.id && (
                <button type="button" onClick={() => setForm(initialForm)} className="rounded-xl border border-cyan-200 px-4 py-2.5 text-cyan-700">
                  Batal Edit
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/80 bg-white/65 p-4">
              <p className="text-sm text-slate-600">Total Produk</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{items.length}</p>
            </article>
            <article className="rounded-2xl border border-white/80 bg-white/65 p-4">
              <p className="text-sm text-slate-600">Stok Menipis</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{lowStockCount}</p>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-white/80 bg-white/70">
                <img src={item.imageUrl || "/image/gambar13.jpg"} alt={item.name} className="h-44 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-600">Stok: {item.stockKg.toLocaleString("id-ID")} kg</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stockStatus === "Ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.stockStatus}
                  </span>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleEdit(item)} className="rounded-lg border border-cyan-200 px-3 py-1.5 text-sm text-cyan-700">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700">
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
