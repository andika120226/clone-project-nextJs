"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminSession } from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

const MENU_ITEMS = [
  { href: "/admin", label: "Beranda" },
  { href: "/admin/products", label: "Katalog Produk" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/history", label: "History" },
  { href: "/admin/monitoring", label: "Monitoring Pengiriman" },
  { href: "/admin/profile", label: "Profil Petani" },
] as const;

export default function AdminSidebar() {
  const router = useRouter();
  const path = usePathname() || "/admin";
  const { session, catalog } = useAdminTenant();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (path === "/admin/login") {
    return null;
  }

  function handleLogout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  return (
    <nav className="space-y-3 rounded-3xl border border-white/70 bg-white/50 p-4 shadow-[0_24px_48px_rgba(2,132,199,0.14)] backdrop-blur-lg">
      <div className="mb-4 px-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Pusat Kendali</h3>
        <p className="text-sm text-slate-700">Admin Petani InfoTani</p>
        <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">{mounted ? (session?.name ?? "Admin") : ""}</p>
          <p className="mt-1">{mounted ? `${catalog?.code} - ${catalog?.name}` : ""}</p>
          <p>{mounted ? catalog?.region : ""}</p>
        </div>
      </div>

      <div className="space-y-1">
        {MENU_ITEMS.map((item) => {
          const active = path === item.href || path.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-cyan-600 text-white shadow-[0_10px_20px_rgba(8,145,178,0.3)]"
                  : "text-slate-700 hover:bg-white/70"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        Keluar
      </button>
    </nav>
  );
}
