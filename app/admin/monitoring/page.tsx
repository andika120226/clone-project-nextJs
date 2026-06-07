"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

const movement = [
  { lat: -5.429, lng: 105.262, label: "Gudang InfoTani" },
  { lat: -5.417, lng: 105.281, label: "Simpang Rajabasa" },
  { lat: -5.401, lng: 105.302, label: "Koridor Distribusi" },
  { lat: -5.382, lng: 105.325, label: "Area Customer" },
];

type TrackingPoint = {
  latitude: number;
  longitude: number;
  note?: string | null;
  recordedAt: string;
};

type Order = {
  id: string;
  trackingId: string;
  status: string;
  buyer: { name: string; email: string; phone?: string };
  address?: string;
  items: Array<{ productId: string; productName?: string; quantityKg: number }>;
  payment?: { status: string; method: string } | null;
  trackingPoints?: TrackingPoint[];
  currentLat?: number | null;
  currentLng?: number | null;
  estimatedArrival?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(item: any): Order {
  if (!item) return item;
  return {
    ...item,
    buyer: item.buyer || (item.customer ? {
      id: item.customer.id,
      name: item.customer.name,
      email: item.customer.email,
      phone: item.customer.phone || item.address?.phoneNumber || "",
    } : { name: "Customer", email: "" }),
  };
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Inputs for custom tracking simulation
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customArrival, setCustomArrival] = useState("");
  const [customStatus, setCustomStatus] = useState("SHIPPED");
  const [customMessage, setCustomMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const activeMovement = movement[trackIndex] ?? movement[0];
  const activeOrder = orders.find((item) => item.id === activeOrderId) ?? orders[0] ?? null;

  const mapLat = activeOrder?.currentLat ?? activeMovement.lat;
  const mapLng = activeOrder?.currentLng ?? activeMovement.lng;
  const mapLabel = activeOrder?.trackingPoints?.[0]?.note ?? activeMovement.label;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prefill control panel when activeOrder changes
  useEffect(() => {
    if (activeOrder) {
      setCustomLat(activeOrder.currentLat?.toString() ?? "-5.429");
      setCustomLng(activeOrder.currentLng?.toString() ?? "105.262");
      setCustomLabel(activeOrder.trackingPoints?.[0]?.note ?? "Gudang InfoTani");
      setCustomStatus(activeOrder.status);
      setCustomMessage("");
      if (activeOrder.estimatedArrival) {
        const d = new Date(activeOrder.estimatedArrival);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setCustomArrival(formatted);
      } else {
        setCustomArrival("");
      }
      setUpdateError("");
      setUpdateSuccess("");
    }
  }, [activeOrder]);

  const fetchOrders = useCallback(async () => {
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
        return;
      }

      const payload = await response.json();
      const rawOrders = Array.isArray(payload?.data) ? payload.data : [];
      const nextOrders = rawOrders.map(normalizeOrder);
      setOrders(nextOrders);
      setActiveOrderId((prev) => (prev || nextOrders[0]?.id || ""));
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    void fetchOrders();
  }, [ready, router, session, fetchOrders]);

  async function handleMoveTruck() {
    if (!session || !activeOrder) {
      return;
    }

    const nextIdx = (trackIndex + 1) % movement.length;
    const point = movement[nextIdx];

    const response = await fetch(`/api/admin/orders/${activeOrder.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-farmer-id": session.tenantId,
      },
      body: JSON.stringify({
        status: "SHIPPED",
        message: `Armada bergerak ke ${point.label}.`,
        truckLocationLabel: point.label,
        currentLat: point.lat,
        currentLng: point.lng,
      }),
    });

    if (!response.ok) {
      return;
    }

    setTrackIndex(nextIdx);
    const payload = await response.json();
    const nextOrders = orders.map((item) => (item.id === activeOrder.id ? normalizeOrder(payload.data) : item));
    setOrders(nextOrders);
  }

  async function handleUpdateTracking(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !activeOrder) {
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-farmer-id": session.tenantId,
        },
        body: JSON.stringify({
          status: customStatus,
          message: customMessage || `Armada update lokasi di ${customLabel}.`,
          truckLocationLabel: customLabel,
          currentLat: Number(customLat),
          currentLng: Number(customLng),
          estimatedArrival: customArrival ? new Date(customArrival).toISOString() : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal memperbarui tracking.");
      }

      setUpdateSuccess("Tracking berhasil diperbarui!");
      const nextOrders = orders.map((item) => (item.id === activeOrder.id ? normalizeOrder(payload.data) : item));
      setOrders(nextOrders);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
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
          <p className="text-sm font-medium text-slate-600">Menyiapkan monitoring Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Monitoring Pengiriman</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Shopee Style Tracking - Google Maps</h1>
          <p className="mt-1 text-sm text-slate-600">Data posisi akan tersinkron ke halaman profil customer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm">
            <select
              value={activeOrderId}
              onChange={(e) => setActiveOrderId(e.target.value)}
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {orders.length === 0 ? (
                <option value="">Tidak ada pesanan aktif</option>
              ) : (
                orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id.slice(-6).toUpperCase()} - {o.buyer.name} ({o.status})
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-white/80 bg-white/65 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Posisi armada sekarang</p>
              <p className="text-lg font-semibold text-slate-900">{mapLabel}</p>
              <p className="text-xs text-slate-500 font-mono">Koordinat: {mapLat}, {mapLng}</p>
            </div>
            <button
              onClick={handleMoveTruck}
              disabled={!activeOrder}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
            >
              Preset Rute
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
            <iframe
              title="Google Maps Monitoring"
              src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=13&output=embed`}
              className="h-96 w-full"
              loading="lazy"
            />
          </div>
        </article>

        <article className="rounded-3xl border border-white/80 bg-white/65 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-cyan-100 pb-2">Kontrol Simulasi Truk & Tanggal</h2>

          {activeOrder ? (
            <form onSubmit={handleUpdateTracking} className="space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-slate-500 font-semibold">Garis Lintang (Latitude)</span>
                  <input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="-5.429"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 font-semibold">Garis Bujur (Longitude)</span>
                  <input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="105.262"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat("-6.2088");
                    setCustomLng("106.8456");
                    setCustomLabel("Pusat PT Info Tani (Jakarta)");
                  }}
                  className="rounded-lg border border-cyan-100 bg-cyan-50/50 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100/50"
                >
                  📍 Set PT Info Tani (Jakarta)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat("-5.3820");
                    setCustomLng("105.2810");
                    setCustomLabel("Area Konsumen (Lampung)");
                  }}
                  className="rounded-lg border border-cyan-100 bg-cyan-50/50 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100/50"
                >
                  📍 Set Konsumen (Lampung)
                </button>
              </div>

              <label className="block">
                <span className="text-xs text-slate-500 font-semibold">Nama / Catatan Lokasi</span>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="Gudang InfoTani / Di Perjalanan..."
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs text-slate-500 font-semibold">Tanggal Selesai Dikirim (Estimasi)</span>
                <input
                  type="datetime-local"
                  value={customArrival}
                  onChange={(e) => setCustomArrival(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-400 block mt-1">Hari/tanggal perkiraan pesanan selesai dikirim.</span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-slate-500 font-semibold">Status Pengiriman</span>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="PROCESSING">DIPROSES</option>
                    <option value="SHIPPED">DIKIRIM (SHIPPED)</option>
                    <option value="DELIVERED">SELESAI (DELIVERED)</option>
                    <option value="CANCELLED">DIBATALKAN</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-slate-500 font-semibold">Notifikasi Pesan (Opsional)</span>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Contoh: Truk transit di Bakauheni..."
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full rounded-xl bg-cyan-600 py-2.5 font-bold text-white transition hover:bg-cyan-700 disabled:bg-cyan-400"
              >
                {isUpdating ? "Memproses..." : "Perbarui Tracking & Status"}
              </button>

              {updateSuccess && <p className="text-xs font-semibold text-emerald-700">{updateSuccess}</p>}
              {updateError && <p className="text-xs font-semibold text-rose-700">{updateError}</p>}
            </form>
          ) : (
            <p className="text-slate-500 text-center py-6">Pilih pesanan aktif terlebih dahulu.</p>
          )}
        </article>
      </div>

      <article className="rounded-3xl border border-white/80 bg-white/65 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Status Sinkronisasi Customer</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {isLoading ? (
            <p>Memuat tracking...</p>
          ) : orders.length === 0 ? (
            <p>Belum ada tracking tersimpan.</p>
          ) : (
            orders.map((item) => (
              <p key={item.id}>
                {item.buyer.name} - {item.status} ({item.trackingPoints?.[0]?.note ?? "belum ada lokasi"})
              </p>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
