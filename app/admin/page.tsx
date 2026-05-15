"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminTenant } from "@/components/admin/useAdminTenant";
import { getDashboardSalesPoints, getTenantOrders, getTenantProducts, toRupiah } from "@/lib/admin-store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { ready, session, catalog } = useAdminTenant();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }
  }, [ready, router, session]);

  const { daily, weekly, totalProducts, activeOrders, revenueToday } = useMemo(() => {
    if (!session) {
      return {
        daily: [] as Array<{ label: string; value: number }>,
        weekly: [] as Array<{ label: string; value: number }>,
        totalProducts: 0,
        activeOrders: 0,
        revenueToday: 0,
      };
    }

    const points = getDashboardSalesPoints(session.tenantId);
    const products = getTenantProducts(session.tenantId);
    const orders = getTenantOrders(session.tenantId);
    const today = new Date();
    const total = orders
      .filter((item) => new Date(item.createdAt).toDateString() === today.toDateString())
      .reduce((sum, item) => sum + item.totalPay, 0);

    return {
      daily: points.daily,
      weekly: points.weekly,
      totalProducts: products.length,
      activeOrders: orders.filter(
        (item) => item.deliveryStatus !== "Selesai" && item.deliveryStatus !== "Dibatalkan",
      ).length,
      revenueToday: total,
    };
  }, [session]);

  const summaryCards = useMemo(
    () => [
      { label: "Produk Tenant", value: totalProducts.toString() },
      { label: "Pesanan Aktif", value: activeOrders.toString() },
      { label: "Penjualan Hari Ini", value: toRupiah(revenueToday) },
      { label: "Katalog Tertaut", value: catalog?.code ?? "-" },
    ],
    [activeOrders, catalog?.code, revenueToday, totalProducts],
  );

  if (!ready || !session) {
    return null;
  }

  return (
    <main className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Dashboard Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Inventaris Produk</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola stok & harga {catalog?.name}</p>
        </div>
        <a
          href="/admin/products"
          className="inline-flex rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:border-cyan-300 hover:shadow-xl"
        >
          + Tambah Produk Baru
        </a>
      </div>

      {/* Summary Cards - 4 Columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-sm transition hover:bg-white/65"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Kurva Penjualan Harian</h2>
            <p className="mt-1 text-sm text-slate-500">Monitoring performa 7 hari terakhir</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e7490" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0e7490" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#0f172a", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#0f172a", fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round((value as number) / 1000000)} jt`}
                />
                <Tooltip formatter={(value) => toRupiah(value as number)} />
                <Area type="monotone" dataKey="value" stroke="#0891b2" fill="url(#dailyGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Kurva Penjualan Mingguan</h2>
            <p className="mt-1 text-sm text-slate-500">Ringkasan 4 minggu terakhir</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#0f172a", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#0f172a", fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round((value as number) / 1000000)} jt`}
                />
                <Tooltip formatter={(value) => toRupiah(value as number)} />
                <Area type="monotone" dataKey="value" stroke="#0369a1" fill="url(#weeklyGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </main>
  );
}
