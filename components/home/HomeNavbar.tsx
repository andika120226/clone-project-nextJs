"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Info Tani", href: "#info-tani" },
  { label: "Info Terkini", href: "#info-terkini" },
  { label: "CTA/About", href: "#cta-about" },
];

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-30 rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="#home"
          className="text-lg font-semibold tracking-tight text-zinc-950"
        >
          InfoTani 🌾
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-600 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors duration-200 hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label="Buka menu navigasi"
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
          Hamburger
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="mt-3 space-y-1 rounded-xl border border-zinc-200 bg-zinc-50 p-2 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-white hover:text-zinc-950"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
