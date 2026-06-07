"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getDashboardSalesPoints, getTenantProducts, toRupiah } from "@/lib/admin-store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { ready, session, catalog } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [activeOrders, setActiveOrders] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }
  }, [ready, router, session]);

  // Fetch active orders count and revenue from API
  const fetchOrderStats = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      setIsLoadingOrders(true);
      const response = await fetch(`/api/admin/orders?scope=active&limit=1`, {
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveOrders(data.summary?.totalOrders ?? 0);

        // Calculate revenue today from active orders
        const today = new Date().toDateString();
        const todayOrders = (data.data || []).filter(
          (order: { createdAt: string; total: number }) =>
            new Date(order.createdAt).toDateString() === today,
        );
        const today_revenue = todayOrders.reduce(
          (sum: number, order: { total: number }) => sum + order.total,
          0,
        );
        setRevenueToday(today_revenue);
      }
    } catch (error) {
      console.error("Fetch orders stats error:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [session]);

  // Initial fetch and polling
  useEffect(() => {
    if (!session) {
      return;
    }

    fetchOrderStats();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchOrderStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [session, fetchOrderStats]);

  const totalProducts = useMemo(() => {
    if (!session) {
      return 0;
    }
    const products = getTenantProducts(session.tenantId);
    return products.length;
  }, [session]);

  const { daily, weekly } = useMemo(() => {
    if (!session) {
      return {
        daily: [] as Array<{ label: string; value: number }>,
        weekly: [] as Array<{ label: string; value: number }>,
      };
    }

    const points = getDashboardSalesPoints(session.tenantId);
    return {
      daily: points.daily,
      weekly: points.weekly,
    };
  }, [session]);

  if (!isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/60 bg-white/35 px-6 py-10 shadow-[0_24px_60px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div className="relative flex flex-col items-center gap-4 rounded-[2rem] border border-cyan-200/70 bg-white/55 px-8 py-10 text-center shadow-[0_18px_40px_rgba(2,132,199,0.12)] backdrop-blur-lg">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="space-y-2">
            <div className="mx-auto h-4 w-48 animate-pulse rounded-full bg-cyan-100/80" />
            <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-sky-100/80" />
          </div>
          <p className="text-sm font-medium text-slate-600">Menyiapkan dashboard Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  const summaryCards = [
    { label: "Produk Tenant", value: totalProducts.toString() },
    {
      label: "Pesanan Aktif",
      value: isLoadingOrders ? "..." : activeOrders.toString(),
    },
    {
      label: "Penjualan Hari Ini",
      value: isLoadingOrders ? "-" : toRupiah(revenueToday),
    },
    { label: "Katalog Tertaut", value: catalog?.code ?? "-" },
  ];

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
          className="inline-flex rounded-xl border border-cyan-200 bg-linear-to-r from-cyan-500 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:border-cyan-300 hover:shadow-xl"
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
            <p
              className={`mt-3 font-bold text-slate-900 truncate ${
                card.value.length > 10
                  ? "text-xl sm:text-2xl xl:text-3xl"
                  : "text-3xl"
              }`}
              title={card.value}
            >
              {card.value}
            </p>
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
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
