"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Package, TrendingUp } from "lucide-react";
import {
  STOCK_KOMODITAS,
  getStatusColor,
  getStatusLabel,
} from "@/lib/stock-data";

function normalizeImagePath(path: string) {
  return path.replace("/image/", "/");
}

type StockDashboardProps = {
  items?: typeof STOCK_KOMODITAS;
};

export default function StockDashboard({ items }: StockDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasCustomItems = Array.isArray(items);
  const displayItems = hasCustomItems ? items : STOCK_KOMODITAS;

  const readyItems = displayItems.filter(
    (item) => item.status === "siap",
  ).length;
  const displayTotalStock = displayItems.reduce((sum, item) => sum + item.stok_kg, 0);

  return (
    <>
      {/* Dashboard Card */}
      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Package className="h-5 w-5 text-cyan-700" />
              Stock Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pantau stok komoditas multi-jenis
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-emerald-50 p-3 sm:p-4">
            <p className="text-xs text-emerald-700 font-semibold">Siap Kirim</p>
            <p className="mt-1 text-xl font-bold text-emerald-900 sm:text-2xl">
              {readyItems}/{displayItems.length}
            </p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-3 sm:p-4">
            <p className="text-xs text-cyan-700 font-semibold">Total Stok</p>
            <p className="mt-1 text-lg font-bold text-cyan-900 sm:text-xl">
              {(displayTotalStock / 1000).toFixed(1)} Ton
            </p>
          </div>
        </div>

        {/* Pop-up Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 to-cyan-700 px-4 py-3 font-semibold text-white transition hover:brightness-110 hover:shadow-lg"
        >
          <TrendingUp className="h-5 w-5" />
          Lihat Detail Stok ({displayItems.length} Komoditas)
        </button>
      </section>

      {/* Modal Pop-up */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-cyan-200 bg-linear-to-r from-cyan-50 to-cyan-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Detail Stok Komoditas
                </h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  {displayItems.length} jenis komoditas
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 hover:bg-cyan-200/50 transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 p-5 sm:p-6">
              {displayItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 px-4 py-6 text-center text-sm text-slate-600">
                  Belum ada produk yang diatur untuk slot katalog ini.
                </div>
              ) : (
                displayItems.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-cyan-100 bg-linear-to-r from-cyan-50/50 to-white p-4 transition hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:h-24 sm:w-24">
                        <Image
                          src={normalizeImagePath(item.gambar)}
                          alt={item.nama_komoditas}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {item.nama_komoditas}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {item.satuan}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                              item.status,
                            )}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="mb-2 space-y-1">
                          <p className="text-sm font-semibold text-slate-700">
                            Stok: {(item.stok_kg / 1000).toFixed(2)} Ton (
                            {item.stok_kg.toLocaleString()} kg)
                          </p>
                          <p className="text-xs text-slate-600">
                            Harga: Rp {item.harga_per_unit.toLocaleString()} / kg
                          </p>
                        </div>

                        <div className="rounded-lg bg-cyan-100/50 px-3 py-2">
                          <p className="text-xs text-cyan-700">Nilai Total</p>
                          <p className="font-bold text-cyan-900">
                            Rp {(
                              item.stok_kg * item.harga_per_unit
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-cyan-200 bg-cyan-50 px-5 py-3 sm:px-6 sm:py-4 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-lg border border-cyan-300 px-4 py-2.5 font-semibold text-cyan-700 transition hover:bg-cyan-100"
              >
                Tutup
              </button>
              <button className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white transition hover:bg-cyan-700">
                Hubungi Petani
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
