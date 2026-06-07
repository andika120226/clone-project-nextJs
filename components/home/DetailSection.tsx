"use client";

import Image from "next/image";
import { ScanLine, ShieldCheck } from "lucide-react";
import React from "react";

const detailItems = [
  {
    title: "Transparansi Stok Dari Lahan ke Gudang",
    description:
      "Setiap petani mitra di Lampung dapat mengunggah kapasitas panen aktual, tanggal siap kirim, dan foto kondisi komoditas. Distributor mendapat visibilitas penuh untuk merencanakan pembelian tanpa menunggu laporan manual.",
    image: "/detail-stok_webP.webp",
    alt: "Pantauan stok panen petani Lampung",
    Icon: ScanLine,
    reverse: false,
  },
  {
    title: "Kualitas Terstandar Untuk Pasar Besar",
    description:
      "InfoTani membantu proses grading kualitas dengan parameter sederhana namun konsisten. Hasilnya, pembeli bisa memfilter produk berdasarkan standar yang dibutuhkan, sementara petani mendapatkan harga yang lebih adil.",
    image: "/detail-kualitas.webp",
    alt: "Validasi kualitas komoditas pertanian",
    Icon: ShieldCheck,
    reverse: true,
  },
];

export default function DetailSection() {
  return (
    <section id="info-terkini" className="mt-16 space-y-8 scroll-mt-24">
      {detailItems.map(({ title, description, image, alt, Icon, reverse }) => (
        <article
          key={title}
          className="grid items-center gap-6 rounded-2xl border border-zinc-200 p-5 sm:p-6 lg:grid-cols-2 lg:gap-10"
        >
          <div className={`space-y-4 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
            <div className="inline-flex rounded-xl bg-zinc-100 p-2.5 text-zinc-900">
              <Icon size={20} />
            </div>
            <h3 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {title}
            </h3>
            <p className="leading-relaxed text-zinc-600">{description}</p>
            <p className="text-sm text-zinc-500">
              Data sample wilayah: Dari sabang sampai marauke, info tani sudah menjangkau petani di seluruh indonesia, dengan fokus utama di sentra produksi seperti Lampung, Jawa Tengah, dan Sumatera Utara. Kami terus memperluas jaringan untuk memastikan setiap petani memiliki akses ke platform kami.
            </p>
          </div>

          <div
            className={`relative h-60 overflow-hidden rounded-xl border border-zinc-200 sm:h-72 lg:h-80 ${
              reverse ? "lg:order-1" : "lg:order-2"
            }`}
          >
            <Image src={image} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </article>
      ))}
    </section>
  );
}
