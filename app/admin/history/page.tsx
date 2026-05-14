"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminOrder, getTenantHistory, toRupiah } from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

export default function AdminHistoryPage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [history, setHistory] = useState<AdminOrder[]>([]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getTenantHistory(session.tenantId));
  }, [ready, router, session]);

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">History</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Riwayat Transaksi Sukses</h1>
      </header>

      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/60 p-6 text-sm text-slate-600">
            Belum ada transaksi sukses.
          </div>
        ) : (
          history.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/80 bg-white/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-700">Bill #{item.billCode}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.customerName}</h2>
                  <p className="text-sm text-slate-600">{item.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleString("id-ID")}</p>
                  <p className="mt-1 text-base font-semibold text-cyan-700">{toRupiah(item.totalPay)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <p>Metode Pembayaran: {item.paymentMethod}</p>
                <p>Status: {item.deliveryStatus}</p>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-100 bg-white/80 p-3">
                <p className="text-sm font-semibold text-slate-800">List Produk Dibeli</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {item.lineItems.map((line, index) => (
                    <li key={`${line.productId}-${index}`}>
                      {line.productName} - {line.quantityKg.toLocaleString("id-ID")} kg x {toRupiah(line.unitPrice)}
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
