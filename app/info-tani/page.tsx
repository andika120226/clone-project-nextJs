"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MapPin, PackageOpen, Sparkles } from "lucide-react";
import {
  getAdminAccountByCatalogId,
  getFarmerProfile,
  getTenantProducts,
  sampleCatalogs,
} from "@/lib/admin-store";

function normalizeImagePath(path: string) {
  return path.replace("/image/", "/");
}

function formatStockLabel(stokKg: number, hasContent: boolean) {
  if (!hasContent) {
    return "Belum diatur";
  }

  if (stokKg <= 0) {
    return "Stok Menipis";
  }

  if (stokKg < 250) {
    return "Stok Menipis";
  }

  return `Ready ${(stokKg / 1000).toFixed(1)} Ton`;
}

function getShortDescription(text: string) {
  const cleaned = text.trim();
  if (cleaned.length <= 130) {
    return cleaned;
  }
  return `${cleaned.slice(0, 130)}...`;
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function InfoTaniCatalogPage() {
  const catalogs = sampleCatalogs();
  const isHydrated = useIsHydrated();

  return (
    <main className="min-h-screen bg-cyan-100/55 pb-14 pt-4">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-200 bg-cyan-100/70 p-5 shadow-sm sm:p-7 lg:p-8">
        <header className="rounded-2xl bg-white/90 px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Katalog Petani Info Tani
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Ada 15 slot katalog yang bisa diisi admin. Saat akun belum diatur,
            kartu publik akan tampil kosong dan siap dikonfigurasi dari dashboard.
          </p>
        </header>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((slot) => {
            const account = isHydrated ? getAdminAccountByCatalogId(slot.id) : null;
            const profile = account ? getFarmerProfile(account.tenantId) : null;
            const products = account ? getTenantProducts(account.tenantId) : [];
            const primaryProduct = products[0] ?? null;
            const displayName = profile?.farmerName?.trim() || account?.name || slot.name;
            const displayLocation = profile ? `Koordinat ${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : slot.region;
            const displayProduct = primaryProduct?.name?.trim() || "Belum ada produk";
            const totalStock = products.reduce((sum, item) => sum + item.stockKg, 0);
            const statusLabel = formatStockLabel(totalStock, products.length > 0);
            const isReady = statusLabel.startsWith("Ready");
            const imageUrl = profile?.profilePhoto || primaryProduct?.imageUrl || "";
            const description = profile?.description || "Admin belum mengisi deskripsi, produk, dan foto untuk slot katalog ini.";

            return (
              <article
                key={slot.id}
                className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)]"
              >
                <div className="relative h-52 w-full overflow-hidden bg-linear-to-br from-cyan-50 via-white to-slate-100">
                  {imageUrl ? (
                    <Image
                      src={normalizeImagePath(imageUrl)}
                      alt={displayProduct}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
                      Slot katalog kosong
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{displayProduct}</p>
                      <h2 className="text-xl font-semibold leading-tight text-slate-900">
                        {displayName}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        isReady
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <PackageOpen className="mr-1.5 h-3.5 w-3.5" />
                      {statusLabel}
                    </span>
                  </div>

                  <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-cyan-700" />
                    {displayLocation}
                  </p>

                  <p className="text-sm leading-relaxed text-slate-600">
                    {getShortDescription(description)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/info-tani/${slot.id}`}
                      className="inline-flex rounded-full bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Kunjungi
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      {slot.code}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
