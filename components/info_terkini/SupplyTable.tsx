"use client";

import { useState, useMemo } from "react";
import { Search, Filter, TrendingUp } from "lucide-react";
import {
  SUPPLY_DATA_INDONESIA,
  getStatusColor,
  getStatusLabel,
  getProvinsiList,
  getKomoditasList,
  filterByProvinsi,
} from "@/lib/supply-data";

export default function SupplyTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKomoditas, setSelectedKomoditas] = useState("");

  const provinsiList = useMemo(() => getProvinsiList(), []);
  const komoditasList = useMemo(() => getKomoditasList(), []);

  const filteredData = useMemo(() => {
    let result = SUPPLY_DATA_INDONESIA;

    // Filter by provinsi
    if (selectedProvinsi) {
      result = filterByProvinsi(selectedProvinsi);
    }

    // Filter by komoditas
    if (selectedKomoditas) {
      result = result.filter((item) => item.komoditas === selectedKomoditas);
    }

    // Search
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.kabupaten_kota
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.komoditas.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return result;
  }, [searchTerm, selectedProvinsi, selectedKomoditas]);

  const totalSupply = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.quantity_ton, 0),
    [filteredData],
  );

  const activeCount = useMemo(
    () => filteredData.filter((item) => item.status === "aktif").length,
    [filteredData],
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-cyan-700" />
          <h2 className="text-2xl font-semibold text-slate-900">
            Status Pasokan per Wilayah
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          Update harian pasokan komoditas pertanian dari seluruh Indonesia
        </p>

        {/* Quick Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700">
              Total Pasokan
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {totalSupply.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600">Ton</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-4">
            <p className="text-xs font-semibold text-cyan-700">Wilayah Aktif</p>
            <p className="mt-1 text-2xl font-bold text-cyan-900">
              {activeCount}
            </p>
            <p className="text-xs text-cyan-600">Lokasi</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-indigo-700">Total Data</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">
              {filteredData.length}
            </p>
            <p className="text-xs text-indigo-600">Record</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-cyan-700" />
          <h3 className="font-semibold text-slate-900">Filter & Pencarian</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kabupaten, kecamatan, atau komoditas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-cyan-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          {/* Filter by Provinsi */}
          <select
            value={selectedProvinsi}
            onChange={(e) => setSelectedProvinsi(e.target.value)}
            className="w-full rounded-lg border border-cyan-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">Pilih Provinsi (Semua)</option>
            {provinsiList.map((provinsi) => (
              <option key={provinsi} value={provinsi}>
                {provinsi}
              </option>
            ))}
          </select>

          {/* Filter by Komoditas */}
          <select
            value={selectedKomoditas}
            onChange={(e) => setSelectedKomoditas(e.target.value)}
            className="w-full rounded-lg border border-cyan-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">Pilih Komoditas (Semua)</option>
            {komoditasList.map((komoditas) => (
              <option key={komoditas} value={komoditas}>
                {komoditas}
              </option>
            ))}
          </select>

          {/* Clear Filter Button */}
          {(searchTerm || selectedProvinsi || selectedKomoditas) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedProvinsi("");
                setSelectedKomoditas("");
              }}
              className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-cyan-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-cyan-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 sm:px-6">
                Provinsi
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 sm:px-6">
                Kabupaten/Kota
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 sm:px-6">
                Kecamatan
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 sm:px-6">
                Komoditas
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-900 sm:px-6">
                Stok (Ton)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 sm:px-6">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-900 sm:table-cell sm:px-6">
                Update
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-100">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-cyan-50/50 transition">
                  <td className="px-4 py-4 font-medium text-slate-900 sm:px-6">
                    {item.provinsi}
                  </td>
                  <td className="px-4 py-4 text-slate-700 sm:px-6">
                    {item.kabupaten_kota}
                  </td>
                  <td className="px-4 py-4 text-slate-600 sm:px-6">
                    {item.kecamatan}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900 sm:px-6">
                    {item.komoditas}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900 sm:px-6">
                    {item.quantity_ton.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 text-xs text-slate-600 sm:table-cell sm:px-6">
                    {item.update_terakhir}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-500 sm:px-6"
                >
                  Tidak ada data yang sesuai dengan filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
        <p className="text-xs text-cyan-700">
          💡 <strong>Tips:</strong> Gunakan filter di atas untuk menemukan
          pasokan komoditas tertentu per provinsi. Klik kolom untuk informasi
          lebih detail.
        </p>
      </div>
    </section>
  );
}
