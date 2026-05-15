"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminOrder,
  DeliveryStatus,
  ShippingOption,
  analyzeLogisticsLoad,
  getTenantOrders,
  toRupiah,
  updateTenantOrderStatus,
  upsertShipmentTracking,
} from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

const statuses: DeliveryStatus[] = ["Konfirmasi", "Proses", "Berangkat", "Selesai", "Dibatalkan"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [weightTonInput, setWeightTonInput] = useState<number>(8);
  const [shippingOption, setShippingOption] = useState<ShippingOption>("PT_INFO_TANI");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }
  }, [ready, router, session]);

  const orders = useMemo<AdminOrder[]>(() => {
    void refreshKey;
    if (!session) {
      return [];
    }
    return getTenantOrders(session.tenantId);
  }, [session, refreshKey]);

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId) ?? orders[0] ?? null,
    [activeOrderId, orders],
  );

  const analysis = useMemo(() => analyzeLogisticsLoad(weightTonInput), [weightTonInput]);

  function handleStatusChange(nextStatus: DeliveryStatus) {
    if (!session || !activeOrder) {
      return;
    }

    const next = updateTenantOrderStatus(session.tenantId, activeOrder.id, nextStatus);
    if (next && nextStatus === "Berangkat") {
      upsertShipmentTracking(session.tenantId, {
        orderId: next.id,
        customerEmail: next.customerEmail,
        customerName: next.customerName,
        vehicleLabel: next.logisticsTypeLabel,
        truckLocationLabel: "Armada berangkat dari gudang tenant",
        latitude: -5.429,
        longitude: 105.262,
        status: "Berangkat",
      });
    }

    setRefreshKey((prev) => prev + 1);
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Order Management</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Kelola Pesanan Masuk</h1>
        <p className="mt-2 text-sm text-slate-600">
          Konfirmasi pesanan, pilih opsi pengiriman, dan update status sampai selesai.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="space-y-3 rounded-3xl border border-white/80 bg-white/65 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Daftar Pesanan</h2>
          {orders.map((order) => {
            const active = order.id === activeOrder?.id;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setActiveOrderId(order.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  active ? "border-cyan-400 bg-cyan-50/70" : "border-cyan-100 bg-white/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cyan-700">Bill #{order.billCode}</p>
                    <h3 className="text-base font-semibold text-slate-900">{order.customerName}</h3>
                    <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{order.deliveryStatus}</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">Total: {toRupiah(order.totalPay)}</p>
              </button>
            );
          })}
        </article>

        <article className="rounded-3xl border border-white/80 bg-white/65 p-5">
          {activeOrder ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-700">Detail Pesanan</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{activeOrder.customerName}</h2>
                <p className="text-sm text-slate-600">{activeOrder.customerEmail}</p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-cyan-100 bg-white/80 p-4 text-sm text-slate-700">
                <p>Berat Muatan: {activeOrder.shipmentWeightTon} ton</p>
                <p>Metode Pembayaran: {activeOrder.paymentMethod}</p>
                <p>Status Pembayaran: {activeOrder.paymentStatus || "SUCCESS"}</p>
                <p>Total Bayar: {toRupiah(activeOrder.totalPay)}</p>
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

              {(activeOrder.messages?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-800">Pesan Pesanan</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {activeOrder.messages?.map((message) => (
                      <div key={message.id} className="rounded-xl bg-cyan-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-cyan-700">
                          {message.sender} • {message.status}
                        </p>
                        <p className="mt-1">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800">Update Status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-sm text-cyan-700"
                    >
                      {status}
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
