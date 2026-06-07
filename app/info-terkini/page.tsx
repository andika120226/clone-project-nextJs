import Image from "next/image";
import {
  BadgeInfo,
  ShieldCheck,
} from "lucide-react";
import SupplyTable from "@/components/info_terkini/SupplyTable";

const statCards = [
  {
    label: "Total Pasokan Tersedia",
    value: "15,240",
    helper: "Ton bahan pangan dan hortikultura",
    tone: "text-emerald-600",
  },
  {
    label: "Wilayah Aktif",
    value: "11",
    helper: "Kecamatan terpantau aktif",
    tone: "text-sky-600",
  },
  {
    label: "Laporan Diproses",
    value: "847",
    helper: "Transaksi dan laporan harian",
    tone: "text-indigo-600",
  },
];

const newsFeed = [
  {
    title:
      "Kementerian Pertanian Perkuat Distribusi Sayuran Segar ke Pasar Kota",
    category: "Official Gov",
    date: "17 Agustus 2025",
    description:
      "Program monitoring pasokan mempercepat validasi stok sayuran dari sentra produksi ke jaringan pasar modern dan tradisional.",
    image: "/govertment.webp",
  },
  {
    title: "Laporan Panen Buah Lokal Lampung Tercatat Naik pada Minggu Ini",
    category: "Official Gov",
    date: "September 2025",
    description:
      "Tim lapangan mencatat peningkatan volume buah lokal seperti pisang dan pepaya dari 11 wilayah aktif di Bandar Lampung.",
    image: "/govertment2.webp",
  },
  {
    title:
      "Penguatan Rantai Pasok Bahan Baku Makan dengan Pemantauan Real-time",
    category: "Official Gov",
    date: "Oktober 2025",
    description:
      "Dashboard transparansi membantu pemerintah meninjau stok beras, umbi, dan komoditas dapur secara cepat dan terukur.",
    image: "/govertment4.webp",
  },
];

export default function InfoTerkiniPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                <ShieldCheck className="h-4 w-4 text-sky-700" />
                Government Transparency Dashboard
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Dashboard Transparansi Pasokan Pertanian
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Pantau pasokan sayuran, bahan baku makanan, dan buah-buahan
                secara real-time dengan tampilan resmi bergaya pemerintah untuk
                membantu pengambilan keputusan yang cepat dan akurat.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <Image
                src="/govertment5.webp"
                alt="Official government transparency visual"
                width={520}
                height={220}
                className="h-40 w-full object-cover sm:h-48 lg:h-44 lg:w-130"
                priority
              />
            </div>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {statCards.map((card) => (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              <div className={`text-4xl font-semibold ${card.tone}`}>
                {card.value}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">
                {card.label}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
              <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                <BadgeInfo className="h-4 w-4" />
                Data terverifikasi
              </div>
            </article>
          ))}
        </section>

        {/* Supply Table dengan Filter & Search */}
        <SupplyTable />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <Image
              src="/govetment3.webp"
              alt="Official agriculture update"
              width={1200}
              height={760}
              className="h-72 w-full object-cover sm:h-80"
            />
            <div className="p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Official Gov
              </p>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">
                Menjaga stabilitas pasokan sayur dan buah untuk pasar kota
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Kementerian Pertanian bersama pemerintah daerah memantau
                distribusi komoditas hortikultura dari sentra produksi ke pasar
                utama. Fokus utama mencakup sayuran segar, bahan baku makan,
                serta buah-buahan agar suplai tetap aman, kualitas terjaga, dan
                harga lebih terkendali.
              </p>
            </div>
          </article>

          <div className="space-y-4">
            {newsFeed.map((news) => (
              <article
                key={news.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid grid-cols-[120px_1fr] gap-4 p-4 sm:grid-cols-[160px_1fr]">
                  <div className="overflow-hidden rounded-2xl">
                    <Image
                      src={news.image}
                      alt={news.title}
                      width={220}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      <ShieldCheck className="h-4 w-4 text-sky-700" />
                      {news.category}
                    </p>
                    <h4 className="mt-3 text-lg font-semibold leading-snug text-slate-900">
                      {news.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-500">{news.date}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {news.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
