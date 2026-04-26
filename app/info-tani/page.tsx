import Image from "next/image";
import Link from "next/link";
import { MapPin, PackageOpen } from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";

function normalizeImagePath(path: string) {
  return path.replace("/image/", "/");
}

function formatStockLabel(stokKg: number) {
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

export default function InfoTaniCatalogPage() {
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
            Pilih mitra petani terbaik berdasarkan lokasi, kualitas komoditas,
            dan status stok terbaru.
          </p>
        </header>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DATA_TANI.map((farmer) => {
            const statusLabel = formatStockLabel(farmer.stok);
            const isReady = statusLabel.startsWith("Ready");

            return (
              <article
                key={farmer.id}
                className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)]"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={normalizeImagePath(farmer.gambar_produk)}
                    alt={farmer.nama_produk}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {farmer.nama_produk}
                      </p>
                      <h2 className="text-xl font-semibold leading-tight text-slate-900">
                        {farmer.nama_petani}
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
                    {farmer.lokasi}
                  </p>

                  <p className="text-sm leading-relaxed text-slate-600">
                    {getShortDescription(farmer.deskripsi_panen)}
                  </p>

                  <Link
                    href={`/info-tani/${farmer.id}`}
                    className="inline-flex rounded-full bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Kunjungi
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
