export type SupplyItem = {
  id: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  komoditas: string;
  quantity_ton: number;
  status: "aktif" | "restocking" | "habis";
  update_terakhir: string;
  last_update_date: string;
  contact_person: string;
  phone: string;
};

export const SUPPLY_DATA_INDONESIA: SupplyItem[] = [
  // LAMPUNG
  {
    id: "lampung-01",
    provinsi: "Lampung",
    kabupaten_kota: "Bandar Lampung",
    kecamatan: "Kedaton",
    komoditas: "Sayuran Daun",
    quantity_ton: 245,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Budi Santoso",
    phone: "081234567890",
  },
  {
    id: "lampung-02",
    provinsi: "Lampung",
    kabupaten_kota: "Bandar Lampung",
    kecamatan: "Sukarame",
    komoditas: "Cabai Merah",
    quantity_ton: 178,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Siti Nurjanah",
    phone: "081345678901",
  },
  {
    id: "lampung-03",
    provinsi: "Lampung",
    kabupaten_kota: "Bandar Lampung",
    kecamatan: "Tanjung Karang Barat",
    komoditas: "Bawang Merah",
    quantity_ton: 189,
    status: "restocking",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Ahmad Hidayat",
    phone: "081456789012",
  },
  {
    id: "lampung-04",
    provinsi: "Lampung",
    kabupaten_kota: "Lampung Tengah",
    kecamatan: "Terusan",
    komoditas: "Padi",
    quantity_ton: 420,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Riyan Pratama",
    phone: "081567890123",
  },
  {
    id: "lampung-05",
    provinsi: "Lampung",
    kabupaten_kota: "Lampung Selatan",
    kecamatan: "Merbau Mataram",
    komoditas: "Singkong Kuning",
    quantity_ton: 230,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Yuni Lestari",
    phone: "081678901234",
  },
  {
    id: "lampung-06",
    provinsi: "Lampung",
    kabupaten_kota: "Lampung Timur",
    kecamatan: "Sukadana",
    komoditas: "Jagung Hibrida",
    quantity_ton: 85,
    status: "aktif",
    update_terakhir: "Kemarin",
    last_update_date: "2026-05-02",
    contact_person: "Arif Hidayat",
    phone: "081789012345",
  },

  // JAWA BARAT
  {
    id: "jabar-01",
    provinsi: "Jawa Barat",
    kabupaten_kota: "Bandung",
    kecamatan: "Cidadap",
    komoditas: "Sayuran Organik",
    quantity_ton: 520,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Dedi Kurnia",
    phone: "082112345678",
  },
  {
    id: "jabar-02",
    provinsi: "Jawa Barat",
    kabupaten_kota: "Bandung",
    kecamatan: "Lembang",
    komoditas: "Wortel & Brokoli",
    quantity_ton: 340,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Eka Wijaya",
    phone: "082223456789",
  },
  {
    id: "jabar-03",
    provinsi: "Jawa Barat",
    kabupaten_kota: "Garut",
    kecamatan: "Cikajang",
    komoditas: "Teh Hitam",
    quantity_ton: 125,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Hendra Gunawan",
    phone: "082334567890",
  },
  {
    id: "jabar-04",
    provinsi: "Jawa Barat",
    kabupaten_kota: "Sukabumi",
    kecamatan: "Cikembar",
    komoditas: "Kakao",
    quantity_ton: 95,
    status: "restocking",
    update_terakhir: "2 hari lalu",
    last_update_date: "2026-05-01",
    contact_person: "Ismail Rahman",
    phone: "082445678901",
  },

  // JAWA TENGAH
  {
    id: "jateng-01",
    provinsi: "Jawa Tengah",
    kabupaten_kota: "Semarang",
    kecamatan: "Gunungpati",
    komoditas: "Padi Premium",
    quantity_ton: 680,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Joko Susilo",
    phone: "082556789012",
  },
  {
    id: "jateng-02",
    provinsi: "Jawa Tengah",
    kabupaten_kota: "Wonosobo",
    kecamatan: "Wonosobo",
    komoditas: "Sayuran Dataran Tinggi",
    quantity_ton: 420,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Kardi Mulyono",
    phone: "082667890123",
  },
  {
    id: "jateng-03",
    provinsi: "Jawa Tengah",
    kabupaten_kota: "Karanganyar",
    kecamatan: "Jumantono",
    komoditas: "Cengkeh",
    quantity_ton: 58,
    status: "aktif",
    update_terakhir: "Kemarin",
    last_update_date: "2026-05-02",
    contact_person: "Luki Hermanto",
    phone: "082778901234",
  },

  // JAWA TIMUR
  {
    id: "jatim-01",
    provinsi: "Jawa Timur",
    kabupaten_kota: "Surabaya",
    kecamatan: "Wonocolo",
    komoditas: "Cabai Rawit",
    quantity_ton: 285,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Mutiah Rahmawati",
    phone: "082889012345",
  },
  {
    id: "jatim-02",
    provinsi: "Jawa Timur",
    kabupaten_kota: "Malang",
    kecamatan: "Dau",
    komoditas: "Apel Malang",
    quantity_ton: 520,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Nur Aziz",
    phone: "082990123456",
  },
  {
    id: "jatim-03",
    provinsi: "Jawa Timur",
    kabupaten_kota: "Pasuruan",
    kecamatan: "Purwodadi",
    komoditas: "Padi & Jagung",
    quantity_ton: 650,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Oya Gunadi",
    phone: "083001234567",
  },

  // SUMATERA UTARA
  {
    id: "sumut-01",
    provinsi: "Sumatera Utara",
    kabupaten_kota: "Medan",
    kecamatan: "Deli Serdang",
    komoditas: "Sayuran Segar",
    quantity_ton: 380,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Pranoto Suryanto",
    phone: "083112345678",
  },
  {
    id: "sumut-02",
    provinsi: "Sumatera Utara",
    kabupaten_kota: "Tapanuli Selatan",
    kecamatan: "Sibolga",
    komoditas: "Kelapa Sawit",
    quantity_ton: 890,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Ridho Firmansyah",
    phone: "083223456789",
  },
  {
    id: "sumut-03",
    provinsi: "Sumatera Utara",
    kabupaten_kota: "Simalungun",
    kecamatan: "Pematang Siantar",
    komoditas: "Tembakau",
    quantity_ton: 145,
    status: "restocking",
    update_terakhir: "3 hari lalu",
    last_update_date: "2026-04-30",
    contact_person: "Sujito Wijaya",
    phone: "083334567890",
  },

  // SUMATERA BARAT
  {
    id: "sumbat-01",
    provinsi: "Sumatera Barat",
    kabupaten_kota: "Padang",
    kecamatan: "Koto Tangah",
    komoditas: "Cabai Merah Besar",
    quantity_ton: 215,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Teguh Suryanto",
    phone: "083445678901",
  },
  {
    id: "sumbat-02",
    provinsi: "Sumatera Barat",
    kabupaten_kota: "Bukittinggi",
    kecamatan: "Bukittinggi",
    komoditas: "Bawang Merah",
    quantity_ton: 185,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Udin Kartika",
    phone: "083556789012",
  },

  // SULAWESI SELATAN
  {
    id: "sulsel-01",
    provinsi: "Sulawesi Selatan",
    kabupaten_kota: "Makassar",
    kecamatan: "Tamalate",
    komoditas: "Cacao Makassar",
    quantity_ton: 320,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Vicky Hermawan",
    phone: "083667890123",
  },
  {
    id: "sulsel-02",
    provinsi: "Sulawesi Selatan",
    kabupaten_kota: "Gowa",
    kecamatan: "Sungguminasa",
    komoditas: "Padi",
    quantity_ton: 580,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Wahab Marzuki",
    phone: "083778901234",
  },

  // BALI
  {
    id: "bali-01",
    provinsi: "Bali",
    kabupaten_kota: "Denpasar",
    kecamatan: "Denpasar Selatan",
    komoditas: "Padi Bali",
    quantity_ton: 420,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Wayan Sujana",
    phone: "083889012345",
  },
  {
    id: "bali-02",
    provinsi: "Bali",
    kabupaten_kota: "Ubud",
    kecamatan: "Ubud",
    komoditas: "Sayuran Organik",
    quantity_ton: 185,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Xander Kusuma",
    phone: "083990123456",
  },

  // NUSA TENGGARA TIMUR
  {
    id: "ntt-01",
    provinsi: "Nusa Tenggara Timur",
    kabupaten_kota: "Kupang",
    kecamatan: "Kupang",
    komoditas: "Jagung & Kacang Tanah",
    quantity_ton: 245,
    status: "aktif",
    update_terakhir: "Hari ini",
    last_update_date: "2026-05-03",
    contact_person: "Yohanes Kaban",
    phone: "084001234567",
  },

  // PAPUA
  {
    id: "papua-01",
    provinsi: "Papua",
    kabupaten_kota: "Jayapura",
    kecamatan: "Jayapura Utara",
    komoditas: "Kelapa & Cokelat",
    quantity_ton: 180,
    status: "aktif",
    update_terakhir: "2 hari lalu",
    last_update_date: "2026-05-01",
    contact_person: "Yohanes Sumule",
    phone: "084112345678",
  },
];

export function getStatusColor(status: string): string {
  switch (status) {
    case "aktif":
      return "bg-emerald-100 text-emerald-700";
    case "restocking":
      return "bg-amber-100 text-amber-700";
    case "habis":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "aktif":
      return "Aktif";
    case "restocking":
      return "Restocking";
    case "habis":
      return "Habis";
    default:
      return "Tidak Diketahui";
  }
}

export function getProvinsiList(): string[] {
  const provinsiSet = new Set(
    SUPPLY_DATA_INDONESIA.map((item) => item.provinsi),
  );
  return Array.from(provinsiSet).sort();
}

export function filterByProvinsi(provinsi: string): SupplyItem[] {
  if (!provinsi) return SUPPLY_DATA_INDONESIA;
  return SUPPLY_DATA_INDONESIA.filter((item) => item.provinsi === provinsi);
}

export function filterByKomoditas(komoditas: string): SupplyItem[] {
  if (!komoditas) return SUPPLY_DATA_INDONESIA;
  return SUPPLY_DATA_INDONESIA.filter((item) =>
    item.komoditas.toLowerCase().includes(komoditas.toLowerCase()),
  );
}

export function getKomoditasList(): string[] {
  const komoditasSet = new Set(
    SUPPLY_DATA_INDONESIA.map((item) => item.komoditas),
  );
  return Array.from(komoditasSet).sort();
}
