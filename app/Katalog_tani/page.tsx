// src/app/katalog-tani/page.tsx
import { PRODUK_TANI } from "@/lib/dataDummy";
import ProductCard from "@/components/ProductCard";

export default function KatalogPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Katalog Hasil Panen</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {PRODUK_TANI.map((item) => (
          <ProductCard key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
}
