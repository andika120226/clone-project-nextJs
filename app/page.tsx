import DetailSection from "@/components/home/DetailSection";

import ModernLandingEnhancements from "@/components/home/ModernLandingEnhancements";

// removed direct auth CTAs from home page (moved to auth/profile flows)

export default function Home() {
  return (
    <div className="min-h-screen bg-cyan-100/40 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <main className="rounded-2xl border border-cyan-200 bg-cyan-100/70 p-4 shadow-sm sm:p-6 lg:p-8">
    
          <ModernLandingEnhancements />
         
          
          <DetailSection />
        </main>
      </div>
    </div>
  );
}
