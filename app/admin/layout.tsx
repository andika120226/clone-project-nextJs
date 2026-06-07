import "../globals.css";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "Admin - InfoTani",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,#b6eeff_0%,#e6fbff_44%,#d7f3ff_100%)] text-slate-800"
    >
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </div>
  );
}
