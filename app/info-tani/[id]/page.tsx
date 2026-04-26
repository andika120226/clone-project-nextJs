import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinned, Warehouse } from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";
import DetailInteractivePanel from "@/components/info_tani/DetailInteractivePanel";

type InfoTaniDetailPageProps = {
  params: Promise<{ id: string }>;
};

function normalizeImagePath(path: string) {
  return path.replace("/image/", "/");
}

function progressFromStock(stokKg: number) {
  const value = Math.round((stokKg / 600) * 100);
  return Math.min(100, Math.max(8, value));
}

function unitPriceByProduct(productName: string) {
  if (productName.toLowerCase().includes("kopi")) {
    return 62000;
  }
  if (productName.toLowerCase().includes("cabai")) {
    return 36000;
  }
  if (productName.toLowerCase().includes("padi")) {
    return 13000;
  }
  if (productName.toLowerCase().includes("jagung")) {
    return 9800;
  }
  return 15000;
}

const bankNames = ["BCA", "Mandiri", "BNI", "BRI", "BSI"];

function getAccountNumber(seed: string) {
  let value = 0;

  for (const character of seed) {
    value = (value * 31 + character.charCodeAt(0)) % 1000000000;
  }

  return `8${String(value).padStart(9, "0")}`.slice(0, 10);
}

export default async function InfoTaniDetailPage({
  params,
}: InfoTaniDetailPageProps) {
  const { id } = await params;
  const farmer = DATA_TANI.find((item) => item.id === id);

  if (!farmer) {
    notFound();
  }

  const stockProgress = progressFromStock(farmer.stok);
  const unitPrice = unitPriceByProduct(farmer.nama_produk);
  const bankName = bankNames[id.length % bankNames.length];
  const accountNumber = getAccountNumber(`${farmer.id}-${farmer.nama_petani}`);

  return (
    <main className="min-h-screen bg-cyan-100/55 pb-16 pt-4">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-cyan-200 bg-cyan-100/70 p-5 shadow-sm sm:p-7 lg:p-8">
        <article className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
          <div className="relative h-56 w-full sm:h-72">
            <Image
              src={normalizeImagePath(farmer.gambar_produk)}
              alt={farmer.nama_produk}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/55 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                Profil Petani
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {farmer.nama_petani}
              </h1>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-50">
                <MapPinned className="h-4 w-4" />
                {farmer.lokasi}
              </p>
            </div>
          </div>
        </article>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Stock Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Komoditas: {farmer.nama_produk}
            </p>

            <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-600">Tersedia saat ini</span>
                <span className="font-semibold text-slate-900">
                  {(farmer.stok / 1000).toFixed(2)} Ton
                </span>
              </div>
              <progress
                value={stockProgress}
                max={100}
                className="stock-progress h-3 w-full overflow-hidden rounded-full border-0 bg-cyan-200"
              />
              <p className="mt-3 text-xs text-slate-500">
                Kapasitas progres stok terhadap target distribusi mingguan.
              </p>
            </div>

            <article className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-relaxed text-slate-700">
              {farmer.deskripsi_panen}
            </article>
          </section>

          <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <Warehouse className="h-5 w-5 text-cyan-700" />
              <h2 className="text-lg font-semibold">Interactive Map</h2>
            </div>
            <p className="text-sm text-slate-600">
              Google Maps placeholder untuk lokasi kebun mitra.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-100 bg-slate-100">
              <iframe
                title="Google Maps Placeholder"
                src="https://maps.google.com/maps?q=Bandar%20Lampung&t=&z=11&ie=UTF8&iwloc=&output=embed"
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Titik peta dapat disesuaikan saat data koordinat kebun tersedia.
            </p>
          </section>
        </div>

        <DetailInteractivePanel
          farmerName={farmer.nama_petani}
          productName={farmer.nama_produk}
          unitPrice={unitPrice}
          bankName={bankName}
          accountNumber={accountNumber}
          accountHolder={farmer.nama_petani}
        />

        <div>
          <Link
            href="/info-tani"
            className="inline-flex rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </section>
    </main>
  );
}
