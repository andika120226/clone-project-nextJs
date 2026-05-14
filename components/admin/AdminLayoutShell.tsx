"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <AdminSidebar />
        </aside>
        <main>
          <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-[0_30px_60px_rgba(14,116,144,0.2)] backdrop-blur-xl md:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
