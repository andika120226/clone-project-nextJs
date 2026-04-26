import Image from "next/image";

export default function HeroSection() {
  return (
    <section id="home" className="space-y-8 scroll-mt-24">
      <div className="max-w-3xl space-y-5">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
          Wawasan Real-time untuk Hasil Panen Maksimal
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          Platform Smart Farming untuk menghubungkan petani dan distributor
          besar di Lampung. Pantau stok, validasi kualitas, dan percepat
          transaksi dalam satu dashboard yang ringkas.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#info-tani"
            className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Mulai Jelajah
          </a>
          <a
            href="#info-terkini"
            className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            Pelajari Fitur
          </a>
        </div>
      </div>

      <div className="relative h-64 overflow-hidden rounded-2xl border border-zinc-200 sm:h-80 lg:h-[460px]">
        <Image
          src="/hero-tani.jpg"
          alt="Petani Lampung memantau hasil panen"
          fill
          priority
          className="object-cover"
        />
      </div>
    </section>
  );
}
