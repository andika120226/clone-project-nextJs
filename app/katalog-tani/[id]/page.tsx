import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  Leaf,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";
import BuyNowButton from "@/components/customer/BuyNowButton";

type DetailPageProps = {
  params: { id: string };
};

function formatTanggal(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DetailKatalogPage({ params }: DetailPageProps) {
  const { id } = params;
  const produk = DATA_TANI.find((item) => item.id === id);

  if (!produk) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
          <h1 className="text-2xl font-semibold">Produk tidak ditemukan</h1>
          <p className="mt-3 text-zinc-300">
            Data komoditas yang kamu cari tidak tersedia atau sudah dipindahkan.
          </p>
          <Link
            href="/katalog-tani"
            className="mt-6 inline-flex rounded-lg bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    );
  }

  const isEmpty = produk.stok === 0;
  const isLowStock = produk.stok < 100;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-8 md:py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Back Button */}
        <Link
          href="/katalog-tani"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Katalog
        </Link>

        <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.45)] md:p-7">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-zinc-800/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-emerald-900/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-400/70">
                <Image
                  src={produk.foto_profil}
                  alt={produk.nama_petani}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  Biodata Petani
                </p>
                <h1 className="mt-1 text-xl font-semibold md:text-2xl">
                  {produk.nama_petani}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 text-emerald-300" />
                  {produk.lokasi}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <BuyNowButton productId={produk.id} />
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Lihat Profile Customer
              </Link>

            </div>
          </div>
        </article>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Deskripsi Produk
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {produk.nama_produk}
            </h2>

            <div className="mt-4 relative h-64 overflow-hidden rounded-xl">
              <Image
                src={produk.gambar_produk}
                alt={produk.nama_produk}
                fill
                className="object-cover"
              />
            </div>

            <div className="prose prose-invert mt-5 max-w-none text-zinc-300">
              <p>{produk.deskripsi_panen}</p>
            </div>

            {isLowStock && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300">
                <TriangleAlert className="h-4 w-4" />
                Stok Hampir Habis!
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Informasi Teknis
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Data Komoditas</h2>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-zinc-800 md:block">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-zinc-800">
                    <th className="w-1/2 bg-zinc-900/60 px-4 py-3 text-left font-medium text-zinc-300">
                      Stok Saat Ini
                    </th>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        isEmpty ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isEmpty ? "0 kg (Stok Habis)" : `${produk.stok} kg`}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <th className="bg-zinc-900/60 px-4 py-3 text-left font-medium text-zinc-300">
                      Kualitas/Kesegaran
                    </th>
                    <td className="px-4 py-3 text-zinc-100">
                      {produk.status_kesehatan}%
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <th className="bg-zinc-900/60 px-4 py-3 text-left font-medium text-zinc-300">
                      Tanggal Panen
                    </th>
                    <td className="px-4 py-3 text-zinc-100">
                      {formatTanggal(produk.tanggal_panen)}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-zinc-900/60 px-4 py-3 text-left font-medium text-zinc-300">
                      Estimasi Restock
                    </th>
                    <td className="px-4 py-3 text-zinc-100">
                      {isEmpty
                        ? formatTanggal(produk.tanggal_restock)
                        : "Stok tersedia, tidak perlu restock"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-400">Stok Saat Ini</p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    isEmpty ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {isEmpty ? "0 kg (Stok Habis)" : `${produk.stok} kg`}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-400">Kualitas/Kesegaran</p>
                <p className="mt-1 text-base text-zinc-100">
                  {produk.status_kesehatan}%
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-400">Tanggal Panen</p>
                <p className="mt-1 inline-flex items-center gap-2 text-base text-zinc-100">
                  <CalendarDays className="h-4 w-4 text-emerald-300" />
                  {formatTanggal(produk.tanggal_panen)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-400">Estimasi Restock</p>
                <p className="mt-1 inline-flex items-center gap-2 text-base text-zinc-100">
                  <Leaf className="h-4 w-4 text-emerald-300" />
                  {isEmpty
                    ? formatTanggal(produk.tanggal_restock)
                    : "Stok tersedia, tidak perlu restock"}
                </p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
