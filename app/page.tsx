import DetailSection from "@/components/home/DetailSection";
import FooterSection from "@/components/home/FooterSection";
import HeroSection from "@/components/home/HeroSection";
import ModernLandingEnhancements from "@/components/home/ModernLandingEnhancements";
import OverviewSection from "@/components/home/OverviewSection";
// removed direct auth CTAs from home page (moved to auth/profile flows)

export default function Home() {
  return (
    <div className="min-h-screen bg-cyan-100/40 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <main className="rounded-2xl border border-cyan-200 bg-cyan-100/70 p-4 shadow-sm sm:p-6 lg:p-8">
          <section className="mb-6 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Customer Portal
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Belanja, login customer, dan tracking armada
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Sign-up atau login untuk menyelesaikan transaksi, melihat riwayat order, dan memantau posisi truk pengiriman.
                </p>
              </div>
              {/* Auth CTAs removed from home menu as requested */}
            </div>
          </section>
          <ModernLandingEnhancements />
          <HeroSection />
          <OverviewSection />
          <DetailSection />
          <FooterSection />
        </main>
      </div>
    </div>
  );
}
