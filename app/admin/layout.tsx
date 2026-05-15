import "../globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Admin - InfoTani",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plusJakarta.className} min-h-screen bg-[radial-gradient(circle_at_top_left,#b6eeff_0%,#e6fbff_44%,#d7f3ff_100%)] text-slate-800`}>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </div>
  );
}
