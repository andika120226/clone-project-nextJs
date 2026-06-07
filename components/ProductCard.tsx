import Image from "next/image";
import StatusBadge from "./StatusBadge";

type ProductData = {
  id: string;
  nama: string;
  lokasi: string;
  kesehatan: string;
  siapPanen: string;
  harga: number;
  gambar: string;
};

type ProductProps = {
  data: ProductData;
};

export default function ProductCard({ data }: ProductProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative h-40 w-full overflow-hidden rounded-md">
        <Image
          src={data.gambar}
          alt={data.nama}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 300px"
          unoptimized={data.gambar?.startsWith("data:")}
        />
      </div>

      <h3 className="mt-3 font-semibold text-zinc-900">{data.nama}</h3>
      <p className="text-sm text-zinc-500">{data.lokasi}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusBadge status={data.kesehatan} />
        <span className="font-semibold text-emerald-700">
          Rp {data.harga}/kg
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Kesiapan Panen: {data.siapPanen}
      </p>
    </article>
  );
}
