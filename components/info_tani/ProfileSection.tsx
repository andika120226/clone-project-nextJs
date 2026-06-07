"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

type ProfileSectionProps = {
  nama_petani?: string;
  lokasi?: string;
  foto_profil?: string;
  gambar_produk?: string;
  gambar_banner?: string;
  nama_produk?: string;
};

function normalizeImagePath(path: string) {
  return path.replace("/image/", "/");
}

export default function ProfileSection({
  nama_petani,
  lokasi,
  foto_profil,
  gambar_produk,
  gambar_banner,
  nama_produk,
}: ProfileSectionProps) {
  const bannerImage = gambar_banner || gambar_produk || "/image/default-banner.jpg";
  const hasBannerImage = Boolean(gambar_banner || gambar_produk);
  const hasProfilePhoto = Boolean(foto_profil);
  const displayName = nama_petani?.trim() || "Katalog belum diatur";
  const displayLocation = lokasi?.trim() || "Lokasi belum diatur";
  const displayProduct = nama_produk?.trim() || "Produk belum diatur";
  
  return (
    <article className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
      <div className="relative h-48 w-full overflow-hidden bg-slate-200 sm:h-56 lg:h-64">
        {hasBannerImage ? (
          <Image
            src={normalizeImagePath(bannerImage)}
            alt={displayProduct}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 800px"
            unoptimized={bannerImage.startsWith("data:")}
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-cyan-100 via-white to-slate-100" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
      </div>

      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="mb-4 flex items-end gap-4">
          <div className="relative -mt-16 h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-lg sm:h-40 sm:w-40">
            {hasProfilePhoto ? (
              <Image
                src={normalizeImagePath(foto_profil ?? "")}
                alt={displayName}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 150px, 200px"
                unoptimized={foto_profil?.startsWith("data:")}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-cyan-50 to-slate-100 text-center text-sm font-semibold text-slate-500">
                Foto belum diatur
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-700 font-semibold">
              Profil Petani
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              {displayName}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-cyan-700" />
              {displayLocation}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-cyan-50 px-4 py-3">
          <p className="text-xs text-slate-600">Komoditas Utama</p>
          <p className="mt-1 font-semibold text-slate-900">{displayProduct}</p>
        </div>
      </div>
    </article>
  );
}
