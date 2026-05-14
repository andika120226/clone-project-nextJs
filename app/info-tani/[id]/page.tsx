import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Warehouse } from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";
import DetailInteractivePanel from "@/components/info_tani/DetailInteractivePanel";
import ProfileSection from "@/components/info_tani/ProfileSection";
import StockDashboard from "@/components/info_tani/StockDashboard";

type InfoTaniDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

  const unitPrice = unitPriceByProduct(farmer.nama_produk);
  const bankName = bankNames[id.length % bankNames.length];
  const accountNumber = getAccountNumber(`${farmer.id}-${farmer.nama_petani}`);

  return (
    <main className="min-h-screen bg-cyan-100/55 pb-16 pt-4">
      {/* Back Button */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-0">
        <Link
          href="/info-tani"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-200/60 px-4 py-2 text-sm font-medium text-cyan-900 transition hover:bg-cyan-200/80 hover:text-cyan-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Info Tani
        </Link>
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-cyan-200 bg-cyan-100/70 p-5 shadow-sm sm:p-7 lg:p-8">
        {/* Profile Section Discord-Style */}
        <ProfileSection
          nama_petani={farmer.nama_petani}
          lokasi={farmer.lokasi}
          foto_profil={farmer.foto_profil}
          gambar_produk={farmer.gambar_produk}
          gambar_banner={farmer.gambar_banner}
          nama_produk={farmer.nama_produk}
        />

        {/* Stock Dashboard & Interactive Map */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stock Dashboard dengan Pop-up */}
          <StockDashboard />

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
