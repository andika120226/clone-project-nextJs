"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

type Order = {
  id: string;
  trackingId: string;
  billCode: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  buyer: { id: string; name: string; email: string };
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

export default function AdminHistoryPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const tenantId = session.tenantId;

    async function fetchHistory() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/orders?scope=history&limit=100`, {
          headers: {
            "x-farmer-id": tenantId,
          },
        });

        if (!response.ok) {
          const errorMessage = await readResponseError(response);
          console.error("Fetch history error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorMessage,
          });
          setHistory([]);
          return;
        }

        const data = await response.json();
        setHistory(data.data || []);
      } catch (error) {
        console.error("Fetch error:", error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [ready, router, session]);

  async function handleDelete(orderId: string) {
    if (!session) return;
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat transaksi ini dari database?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      if (!response.ok) {
        const errorMsg = await readResponseError(response);
        throw new Error(errorMsg || "Gagal menghapus transaksi.");
      }

      alert("Transaksi berhasil dihapus.");
      setHistory((prev) => prev.filter((item) => item.id !== orderId));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/60 bg-white/35 px-6 py-10 shadow-[0_24px_60px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div className="relative flex flex-col items-center gap-4 rounded-4xl border border-cyan-200/70 bg-white/55 px-8 py-10 text-center shadow-[0_18px_40px_rgba(2,132,199,0.12)] backdrop-blur-lg">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="space-y-2">
            <div className="mx-auto h-4 w-52 animate-pulse rounded-full bg-cyan-100/80" />
            <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-sky-100/80" />
          </div>
          <p className="text-sm font-medium text-slate-600">Menyiapkan riwayat Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">History</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Riwayat Transaksi Sukses</h1>
        <p className="mt-2 text-sm text-slate-600">
          {history.length} transaksi selesai {isLoading ? "• Memuat..." : ""}
        </p>
      </header>

      <div className="space-y-3">
        {history.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/60 p-6 text-sm text-slate-600">
            Belum ada transaksi selesai.
          </div>
        ) : (
          history.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/80 bg-white/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-700">Bill #{item.billCode}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.buyer.name}</h2>
                  <p className="text-sm text-slate-600">{item.buyer.email}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleString("id-ID")}</p>
                  <p className="text-base font-semibold text-cyan-700">Rp {item.total.toLocaleString("id-ID")}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100/70"
                  >
                    Hapus Riwayat
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <p>Metode Pembayaran: {item.paymentMethod}</p>
                <p>Status: {item.statusLabel}</p>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-100 bg-white/80 p-3">
                <p className="text-sm font-semibold text-slate-800">List Produk Dibeli</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {item.items.map((line) => (
                    <li key={line.id}>
                      {line.productName} - {line.quantityKg.toLocaleString("id-ID")} kg x Rp {line.unitPrice.toLocaleString("id-ID")}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
