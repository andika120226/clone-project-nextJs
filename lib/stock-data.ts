export type StockItem = {
  id: string;
  nama_komoditas: string;
  stok_kg: number;
  satuan: string;
  harga_per_unit: number;
  status: "siap" | "menipis" | "habis";
  gambar: string;
};

export const STOCK_KOMODITAS: StockItem[] = [
  {
    id: "padi-01",
    nama_komoditas: "Padi Ciherang",
    stok_kg: 420000,
    satuan: "kg",
    harga_per_unit: 13000,
    status: "siap",
    gambar: "/image/gambar1.jpg",
  },
  {
    id: "singkong-01",
    nama_komoditas: "Singkong Kuning",
    stok_kg: 230000,
    satuan: "kg",
    harga_per_unit: 4500,
    status: "siap",
    gambar: "/image/gambar_kubis1.jpg",
  },
  {
    id: "cabai-01",
    nama_komoditas: "Cabai Merah Keriting",
    stok_kg: 0,
    satuan: "kg",
    harga_per_unit: 36000,
    status: "habis",
    gambar: "/image/gambar2.jpg",
  },
  {
    id: "jagung-01",
    nama_komoditas: "Jagung Hibrida",
    stok_kg: 85000,
    satuan: "kg",
    harga_per_unit: 9800,
    status: "siap",
    gambar: "/image/gambar3.jpg",
  },
  {
    id: "kopi-01",
    nama_komoditas: "Kopi Robusta",
    stok_kg: 0,
    satuan: "kg",
    harga_per_unit: 62000,
    status: "habis",
    gambar: "/image/gambar_kubis2.jpg",
  },
];

export function getStatusColor(status: string) {
  switch (status) {
    case "siap":
      return "bg-emerald-100 text-emerald-700";
    case "menipis":
      return "bg-amber-100 text-amber-700";
    case "habis":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "siap":
      return "Siap Kirim";
    case "menipis":
      return "Stok Menipis";
    case "habis":
      return "Stok Habis";
    default:
      return "Tidak Diketahui";
  }
}
