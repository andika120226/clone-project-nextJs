import Link from "next/link";
import {
  Camera,
  CirclePlay,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

const footerLinks = {
  "Info Tani": [
    "Komoditas Lampung",
    "Harga Harian",
    "Mitra Petani",
    "Distribusi",
  ],
  "Info Terkini": [
    "Artikel Smart Farming",
    "Riset Cuaca",
    "Update Pasar",
    "Agenda Komunitas",
  ],
};

const socialLinks = [
  { name: "Instagram", href: "#", Icon: Camera },
  { name: "Twitter", href: "#", Icon: Send },
  { name: "Youtube", href: "#", Icon: CirclePlay },
  { name: "WhatsApp", href: "#", Icon: MessageCircle },
];

export default function FooterSection() {
  return (
    <footer
      id="cta-about"
      className="mt-16 border-t border-zinc-200 pt-10 scroll-mt-24"
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <h4 className="text-base font-semibold">InfoTani 🌾</h4>
          <p className="text-sm leading-relaxed text-zinc-600">
            Ekosistem digital untuk mempertemukan petani Di Seluruh Indonesia
            dengan distributor skala besar secara transparan.
          </p>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div className="space-y-3" key={title}>
            <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
            <ul className="space-y-2 text-sm text-zinc-600">
              {links.map((link) => (
                <li key={link}>
                  <Link href="#" className="hover:text-zinc-900">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-900">Kontak</h4>
          <ul className="space-y-3 text-sm text-zinc-600">
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5" />
              halo@infotani.id
            </li>
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5" />
              +62 813-7777-9090
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5" />
              Bandar Lampung, Lampung
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center">
        <p>© 2026 InfoTani. Seluruh hak cipta dilindungi.</p>
        <div className="flex items-center gap-3">
          {socialLinks.map(({ name, href, Icon }) => (
            <Link
              key={name}
              href={href}
              aria-label={name}
              className="rounded-lg border border-zinc-200 p-2 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
