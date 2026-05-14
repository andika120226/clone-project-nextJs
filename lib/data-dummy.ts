export type DataTaniItem = {
  id: string;
  nama_petani: string;
  lokasi: string;
  nama_produk: string;
  stok: number;
  status_kesehatan: number;
  deskripsi_panen: string;
  foto_profil: string;
  gambar_produk: string;
  gambar_banner: string;
  tanggal_panen: string;
  tanggal_restock: string;
};

export const DATA_TANI: DataTaniItem[] = [
  {
    id: "padi-ciherang-01",
    nama_petani: "Budi Santoso",
    lokasi: "Lampung Tengah",
    nama_produk: "Padi Ciherang",
    stok: 420,
    status_kesehatan: 96,
    deskripsi_panen:
      "Padi Ciherang dari lahan sawah irigasi teknis dikelola dengan pola tanam terpadu dan pemupukan berimbang. Proses panen dilakukan bertahap untuk menjaga kualitas gabah tetap seragam, kadar air stabil, serta meminimalkan kehilangan hasil. Komoditas ini cocok untuk kebutuhan beras harian skala rumah tangga hingga mitra distribusi lokal karena memiliki karakter nasi pulen, warna cerah, dan aroma yang konsisten.",
    foto_profil: "/image/gambar13.jpg",
    gambar_produk: "/image/gambar13.jpg",
    gambar_banner: "/image/detail-kualitas.jpg",
    tanggal_panen: "2026-04-10",
    tanggal_restock: "2026-04-22",
  },
  {
    id: "cabai-merah-02",
    nama_petani: "Siti Nurjanah",
    lokasi: "Lampung Selatan",
    nama_produk: "Cabai Merah Keriting",
    stok: 0,
    status_kesehatan: 91,
    deskripsi_panen:
      "Cabai merah keriting dibudidayakan di lahan dataran rendah dengan manajemen hama terpadu dan pemantauan cuaca harian. Hasil panen dipilah berdasarkan tingkat kematangan dan ukuran untuk memastikan kualitas pengiriman tetap prima. Saat ini stok kosong karena seluruh batch panen sebelumnya telah terserap pasar, sementara tanaman fase berikutnya sedang menuju masa petik.",
    foto_profil: "/image/profil-siti.jpg",
    gambar_produk: "/image/gambar2.jpg",
    gambar_banner: "/image/banner-cabai-merah.jpg",
    tanggal_panen: "2026-04-07",
    tanggal_restock: "2026-04-18",
  },
  {
    id: "jagung-hibrida-03",
    nama_petani: "Riyan Pratama",
    lokasi: "Lampung Timur",
    nama_produk: "Jagung Hibrida",
    stok: 85,
    status_kesehatan: 94,
    deskripsi_panen:
      "Jagung hibrida dipanen pada umur optimal untuk menjaga kadar air dan bobot biji sesuai standar penjualan pakan maupun konsumsi. Penanganan pascapanen dilakukan dengan pengeringan terkontrol agar mutu tetap stabil selama distribusi. Produk ini memiliki ukuran tongkol relatif seragam dan tingkat kerusakan fisik rendah.",
    foto_profil: "/image/profil-riyan.jpg",
    gambar_produk: "/image/gambar3.jpg",
    gambar_banner: "/image/banner-jagung-hibrida.jpg",
    tanggal_panen: "2026-04-09",
    tanggal_restock: "2026-04-20",
  },
  {
    id: "singkong-kuning-04",
    nama_petani: "Yuni Lestari",
    lokasi: "Lampung Utara",
    nama_produk: "Singkong Kuning",
    stok: 230,
    status_kesehatan: 93,
    deskripsi_panen:
      "Singkong kuning diproduksi dari lahan kering dengan perawatan intensif pada fase pembentukan umbi. Umbi dipanen selektif berdasarkan ukuran dan tingkat kematangan agar tekstur tetap padat serta cita rasa tidak pahit. Komoditas ini cocok untuk industri olahan maupun konsumsi segar karena tingkat kebersihan dan keseragaman ukuran dijaga ketat.",
    foto_profil: "/image/profil-yuni.jpg",
    gambar_produk: "/image/gambar_kubis1.jpg",
    gambar_banner: "/image/banner-singkong-kuning.jpg",
    tanggal_panen: "2026-04-11",
    tanggal_restock: "2026-04-25",
  },
  {
    id: "kopi-robusta-05",
    nama_petani: "Arif Hidayat",
    lokasi: "Lampung Barat",
    nama_produk: "Kopi Robusta",
    stok: 0,
    status_kesehatan: 97,
    deskripsi_panen:
      "Kopi robusta dipetik merah dan diproses menggunakan metode semi-washed untuk menjaga profil rasa khas Lampung yang tegas dan body kuat. Setiap batch melalui sortasi bertingkat untuk menekan cacat biji dan meningkatkan konsistensi seduhan. Stok saat ini habis karena permintaan mitra roastery meningkat, dengan restock menunggu proses pengeringan batch baru.",
    foto_profil: "/image/profil-arif.jpg",
    gambar_produk: "/image/gambar_kubis2.jpg",
    gambar_banner: "/image/banner-kopi-robusta.jpg",
    tanggal_panen: "2026-04-06",
    tanggal_restock: "2026-04-27",
  },
];
