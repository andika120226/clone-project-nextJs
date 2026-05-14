import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
      <div className="font-bold text-xl text-green-700">InfoTani 🌾</div>
      <div className="hidden md:flex gap-6 text-gray-600 font-medium">
        <Link href="/" className="hover:text-green-600">
          Home
        </Link>
        <Link href="/katalog-tani" className="hover:text-green-600">
          Info Tani
        </Link>
        <Link href="/real-time" className="hover:text-green-600">
          Info Terkini
        </Link>
        <Link href="/cta" className="bg-black text-white px-4 py-2 rounded-md">
          CTA/About
        </Link>
      </div>
      <button className="md:hidden p-2 bg-black text-white rounded">
        Menu
      </button>
    </nav>
  );
}
