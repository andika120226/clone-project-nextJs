import { ChartLine, MessageCircleMore, Sprout } from "lucide-react";

const overviewItems = [
  {
    title: "Katalog Digital",
    description:
      "Data komoditas Lampung dari singkong, cabai, hingga jagung lengkap dengan mutu panen, kadar air, dan kesiapan kirim.",
    Icon: Sprout,
  },
  {
    title: "Pantauan Real-time",
    description:
      "Pantau status stok siap pasok per kecamatan secara langsung, termasuk estimasi tonase harian dan update gudang mitra.",
    Icon: ChartLine,
  },
  {
    title: "Forum & Chat",
    description:
      "Percepat negosiasi antara petani, pengepul, dan distributor melalui chat instan dengan jejak diskusi yang rapi.",
    Icon: MessageCircleMore,
  },
];

export default function OverviewSection() {
  return (
    <section id="info-tani" className="mt-16 scroll-mt-24">
      <div className="mb-8 max-w-2xl space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fondasi Operasional InfoTani
        </h2>
        <p className="text-zinc-600">
          Tiga pilar utama untuk memastikan pasokan komoditas pertanian Lampung
          berjalan cepat, presisi, dan terpercaya.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {overviewItems.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
          >
            <div className="mb-4 inline-flex rounded-xl bg-white p-2.5 text-zinc-800 shadow-sm">
              <Icon size={20} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
