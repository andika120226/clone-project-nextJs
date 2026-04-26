import Image from "next/image";
import Link from "next/link";
import { MapPin, PackageCheck, PackageX } from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";

export default function KatalogTaniPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-8 md:py-10">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
              InfoTani Premium Catalog
            </p>
            <h1 className="mt-2 text-2xl font-semibold md:text-4xl">
              Katalog Komoditas Lampung
            </h1>
          </div>
          <p className="max-w-md text-sm text-zinc-300 md:text-base">
            Jelajahi poster komoditas unggulan langsung dari petani lokal dengan
            data stok real-time dan kualitas panen terverifikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {DATA_TANI.map((item) => {
            const isReady = item.stok > 0;

            return (
              <Link
                key={item.id}
                href={`/katalog-tani/${item.id}`}
                className="group relative block h-[70vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-[0_20px_70px_rgba(0,0,0,0.45)] md:h-[78vh]"
              >
                <Image
                  src={item.gambar_produk}
                  alt={item.nama_produk}
                  fill
                  priority={false}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-600/70 bg-black/50 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur">
                    {isReady ? (
                      <PackageCheck className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <PackageX className="h-4 w-4 text-rose-400" />
                    )}
                    <span
                      className={isReady ? "text-emerald-300" : "text-rose-300"}
                    >
                      {isReady ? `Stok ${item.stok} kg` : "Stok Habis"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold leading-tight md:text-3xl">
                    {item.nama_produk}
                  </h2>

                  <p className="mt-2 flex items-center gap-2 text-sm text-zinc-200 md:text-base">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {item.lokasi}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
