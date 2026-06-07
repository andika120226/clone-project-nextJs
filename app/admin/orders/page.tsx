"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DeliveryStatus,
  ShippingOption,
  analyzeLogisticsLoad,
  toRupiah,
} from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

type Order = {
  id: string;
  trackingId: string;
  billCode: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  buyer: { id: string; name: string; email: string; phone?: string };
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  logisticsCost: number;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantityKg: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

const statuses: Array<{ label: DeliveryStatus; value: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" }> = [
  { label: "Konfirmasi", value: "CONFIRMED" },
  { label: "Proses", value: "PROCESSING" },
  { label: "Berangkat", value: "SHIPPED" },
  { label: "Selesai", value: "DELIVERED" },
  { label: "Dibatalkan", value: "CANCELLED" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [weightTonInput, setWeightTonInput] = useState<number>(8);
  const [shippingOption, setShippingOption] = useState<ShippingOption>("PT_INFO_TANI");
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevCountRef = useRef(0);

  async function readResponseError(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return typeof payload?.error === "string" ? payload.error : JSON.stringify(payload);
    }

    return await response.text();
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    [],
  );

  async function fetchOrders() {
    if (!session) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders?scope=active&limit=20`, {
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      if (!response.ok) {
        const errorMessage = await readResponseError(response);
        console.error("Fetch orders error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorMessage,
        });
        addToast(errorMessage || `Gagal mengambil data pesanan (${response.status})`, "error");
        return;
      }

      const data = await response.json();
      const newOrders = data.data || [];

      setOrders(newOrders);

      // Auto-notify on new paid orders
      if (newOrders.length > prevCountRef.current) {
        const newlyPaidCount = newOrders.filter(
          (order: Order) => order.paymentStatus === "SUCCESS",
        ).length;
        if (newlyPaidCount > 0) {
          addToast(`✓ ${newlyPaidCount} pesanan baru pembayaran sukses!`, "success");
        }
      }
      prevCountRef.current = newOrders.length;

      setActiveOrder((prev) => {
        if (!newOrders.length) {
          return null;
        }

        if (!prev) {
          return newOrders[0];
        }

        return newOrders.find((order: Order) => order.id === prev.id) ?? newOrders[0];
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error("Fetch error:", error);
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const memoFetchOrders = useCallback(fetchOrders, [session, addToast]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    // Initial fetch
    memoFetchOrders();

    return;
  }, [ready, router, session, memoFetchOrders]);

  const analysis = useMemo(() => analyzeLogisticsLoad(weightTonInput), [weightTonInput]);

  function handleStatusChange(nextStatus: DeliveryStatus) {
    if (!session || !activeOrder) {
      return;
    }

    void (async () => {
      try {
        const statusMap = statuses.find((item) => item.label === nextStatus);
        if (!statusMap) {
          throw new Error("Status tidak valid.");
        }

        const response = await fetch(`/api/admin/orders/${activeOrder.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-farmer-id": session.tenantId,
          },
          body: JSON.stringify({
            status: statusMap.value,
            message: `Status order diubah menjadi ${nextStatus}.`,
            truckLocationLabel: nextStatus === "Berangkat" ? "Armada menuju alamat customer" : undefined,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Gagal update status");
        }

        addToast(`Status diupdate ke ${nextStatus}`, "success");
        await memoFetchOrders();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Gagal update status";
        addToast(msg, "error");
      }
    })();
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/60 bg-white/35 px-6 py-10 shadow-[0_24px_60px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div className="relative flex flex-col items-center gap-4 rounded-4xl border border-cyan-200/70 bg-white/55 px-8 py-10 text-center shadow-[0_18px_40px_rgba(2,132,199,0.12)] backdrop-blur-lg">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="space-y-2">
            <div className="mx-auto h-4 w-56 animate-pulse rounded-full bg-cyan-100/80" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-sky-100/80" />
          </div>
          <p className="text-sm font-medium text-slate-600">Menyiapkan pesanan Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-6">
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition ${
                toast.type === "success"
                  ? "bg-emerald-500"
                  : toast.type === "error"
                    ? "bg-rose-500"
                    : "bg-cyan-500"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Order Management</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Kelola Pesanan Masuk</h1>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{orders.length} pesanan aktif</p>
          <button
            type="button"
            onClick={() => void memoFetchOrders()}
            className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
          >
            Refresh Pesanan
          </button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="space-y-3 rounded-3xl border border-white/80 bg-white/65 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Daftar Pesanan</h2>
          {isLoading && (
            <p className="text-sm text-slate-600">Memuat data...</p>
          )}
          {orders.map((order) => {
            const active = order.id === activeOrder?.id;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setActiveOrder(order)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  active ? "border-cyan-400 bg-cyan-50/70" : "border-cyan-100 bg-white/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cyan-700">Bill #{order.billCode}</p>
                    <h3 className="text-base font-semibold text-slate-900">{order.buyer.name}</h3>
                    <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus === "SUCCESS" ? "✓ BAYAR" : "PENDING"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700">Total: Rp {order.total.toLocaleString("id-ID")}</p>
              </button>
            );
          })}
          {orders.length === 0 && !isLoading && (
            <p className="text-sm text-slate-600">Belum ada pesanan aktif</p>
          )}
        </article>

        <article className="rounded-3xl border border-white/80 bg-white/65 p-5">
          {activeOrder ? (
            <div className="space-y-5">
              {/* Struk / Bill Invoice Detail Section */}
              <div className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">BILL INVOICE (ADMIN)</h3>
                    <p className="text-xs text-slate-500 font-mono">Bill #{activeOrder.billCode} / ID: {activeOrder.id}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activeOrder.paymentStatus === "SUCCESS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {activeOrder.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Waktu Pemesanan</span>
                  <span>
                    {new Date(activeOrder.createdAt).toLocaleString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Buyer / Profile info */}
                <div className="rounded-2xl border border-cyan-100 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
                  <p className="font-semibold text-cyan-800 uppercase tracking-wider">Informasi Pembeli</p>
                  <div className="grid gap-1">
                    <p><strong>Nama:</strong> {activeOrder.buyer.name}</p>
                    <p><strong>No. WA/Telepon:</strong> {activeOrder.buyer.phone || "-"}</p>
                    <p><strong>Email:</strong> {activeOrder.buyer.email}</p>
                    <p className="border-t border-slate-200 pt-1.5 mt-1"><strong>Alamat Kirim:</strong> {activeOrder.address || "-"}</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div>
                  <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-2">Rincian Barang</p>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-semibold">
                          <th className="px-3 py-2">Produk</th>
                          <th className="px-3 py-2 text-center">Qty (kg)</th>
                          <th className="px-3 py-2 text-right">Harga/kg</th>
                          <th className="px-3 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrder.items.map((item, idx) => (
                          <tr key={item.id || idx} className="border-b border-slate-100 last:border-0 bg-white">
                            <td className="px-3 py-2.5 font-medium text-slate-900">{item.productName}</td>
                            <td className="px-3 py-2.5 text-center text-slate-700">{item.quantityKg.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2.5 text-right text-slate-700">Rp {item.unitPrice.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-slate-900">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {activeOrder.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Logistik:</span>
                    <span>Rp {activeOrder.logisticsCost.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-cyan-800">
                    <span>TOTAL:</span>
                    <span>Rp {activeOrder.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Metode Pembayaran</span>
                  <span className="font-semibold text-slate-800">{activeOrder.paymentMethod}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Opsi Pengiriman</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setShippingOption("PT_INFO_TANI")}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      shippingOption === "PT_INFO_TANI"
                        ? "border-cyan-400 bg-cyan-50 text-cyan-800"
                        : "border-cyan-100 bg-white"
                    }`}
                  >
                    Kirim via Truk PT InfoTani
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingOption("SELF_PICKUP")}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      shippingOption === "SELF_PICKUP"
                        ? "border-cyan-400 bg-cyan-50 text-cyan-800"
                        : "border-cyan-100 bg-white"
                    }`}
                  >
                    Ambil Sendiri ke Lokasi Petani
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-800">Logistik Analyzer (PT InfoTani)</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="text-sm text-slate-700">Berat Muatan (ton)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weightTonInput}
                    onChange={(event) => setWeightTonInput(Number(event.target.value))}
                    placeholder="Contoh: 8"
                    title="Input berat muatan dalam ton"
                    className="w-36 rounded-lg border border-cyan-100 bg-white px-3 py-2"
                  />
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {analysis.recommendation.map((plan) => (
                    <p key={plan.vehicleType}>
                      {plan.vehicleType}: {plan.count} unit x {toRupiah(plan.additionalCost)} = {toRupiah(plan.subtotalCost)}
                    </p>
                  ))}
                  <p className="font-semibold text-cyan-800">Total Tambahan: {toRupiah(analysis.totalAdditionalCost)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Update Status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status.label}
                      type="button"
                      onClick={() => handleStatusChange(status.label)}
                      className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-sm text-cyan-700"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Belum ada pesanan.</p>
          )}
        </article>
      </div>
    </section>
  );
}
