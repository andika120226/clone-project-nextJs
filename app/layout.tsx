import "./globals.css";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Info Tani", href: "/info-tani" },
  { label: "Info Terkini", href: "/info-terkini" },
  { label: "Profile", href: "/profile" },
];

const infoTaniLinks = [
  { label: "Komoditas", href: "/info-tani" },
  { label: "Harga", href: "/info-terkini" },
  { label: "Mitra", href: "/hubungi-kami" },
];

const infoTerkiniLinks = [
  { label: "Artikel", href: "/info-terkini" },
  { label: "Cuaca", href: "/info-terkini/monitoring" },
  { label: "Pasar", href: "/info-tani" },
];

const socialLinks = [
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.6 5.82A4.77 4.77 0 0 1 13.7 3h-2.44v12.1a2.23 2.23 0 1 1-1.54-2.12V10.5a4.64 4.64 0 1 0 4 4.6V9.24a7.2 7.2 0 0 0 4.2 1.35V8.17a4.76 4.76 0 0 1-1.31-.2Z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="m20.67 3.26-17.1 6.6c-1.17.47-1.16 1.12-.2 1.42l4.39 1.37 1.69 5.27c.2.56.1.79.7.79.46 0 .66-.2.92-.43.16-.16 1.08-1.05 2.07-2.01l4.3 3.18c.8.44 1.37.21 1.57-.73l2.91-13.72c.29-1.16-.44-1.68-1.25-1.31Zm-11.8 9.08 9.58-6.04c.48-.29.92-.13.56.2l-7.87 7.1-.3 3.07-1.97-4.33Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.5 7.2a3 3 0 0 0-2.12-2.12C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.38.58A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8ZM9.6 15.06V8.94L15.98 12 9.6 15.06Z" />
      </svg>
    ),
  },

];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={plusJakartaSans.className}>
        <div className="min-h-screen bg-[linear-gradient(135deg,#00FFFF_0%,#E0FFFF_52%,#B0E0E6_100%)] text-slate-800">
          <header className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-md">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight text-emerald-900 sm:text-2xl"
              >
                InfoTani 🌾
              </Link>

              <div className="hidden items-center gap-8 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-slate-700 transition hover:text-emerald-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-full border border-cyan-300/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                >
                  Masuk Customer
                </Link>
                <Link
                  href="/hubungi-kami"
                  className="rounded-full bg-linear-to-r from-green-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-cyan-500/40"
                >
                  Hubungi Kami
                </Link>
              </div>
            </nav>

            <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto px-4 pb-3 md:hidden sm:px-6 lg:px-8">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className="whitespace-nowrap rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:text-emerald-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </header>

          <main className="min-h-screen px-4 pb-16 pt-32 md:pt-24 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-white/40 bg-white/80 backdrop-blur-sm">
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
              <section>
                <h3 className="text-lg font-bold text-emerald-900">InfoTani</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Platform informasi pertanian modern yang membantu petani dan
                  mitra memahami komoditas, harga, serta perkembangan pasar
                  secara cepat dan akurat.
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  Info Tani
                </h4>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {infoTaniLinks.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="transition hover:text-emerald-700"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  Info Terkini
                </h4>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {infoTerkiniLinks.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="transition hover:text-emerald-700"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  Kontak
                </h4>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>
                    <a
                      className="transition hover:text-emerald-700"
                      href="mailto:halo@infotani.id"
                    >
                      halo@infotani.id
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition hover:text-emerald-700"
                      href="https://wa.me/6281234567890"
                    >
                      +62 812-3456-7890
                    </a>
                  </li>
                  <li>Indonesia, sabang samapai marauke</li>
                </ul>
              </section>
            </div>

            <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 border-t border-slate-200/60 px-4 py-5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
              <p className="text-sm text-slate-600">
                Copyright 2026 InfoTani. All rights reserved.
              </p>

              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="rounded-full bg-white p-2 text-slate-600 shadow transition duration-300 hover:-translate-y-0.5 hover:text-cyan-600 hover:shadow-[0_0_18px_rgba(34,211,238,0.65)]"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
