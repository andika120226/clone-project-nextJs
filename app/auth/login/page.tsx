import Link from "next/link";
import CustomerAuthForm from "@/components/customer/CustomerAuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 md:px-8">
      <section className="mx-auto grid w-full max-w-6xl gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
            Customer Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Login Customer InfoTani
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Masuk untuk melanjutkan checkout, melihat invoice, dan memantau
            posisi truk pengiriman pada profile customer.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Belum punya akun? Sign-up dulu
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <CustomerAuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}
