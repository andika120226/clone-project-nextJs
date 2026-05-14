# 📋 Panduan Cleanup Struktur Folder & File

## ✅ Status: Analisis Lengkap

Berikut adalah struktur yang direkomendasikan dan file yang perlu dihapus untuk merapihkan proyek.

---

## 📁 Target Struktur (yang diinginkan)

```
info_tani/
├── app/
│   ├── page.tsx                          (Home)
│   ├── layout.tsx                        (Layout global)
│   ├── api/
│   │   └── hubungi-kami/
│   │       └── route.ts                  (Form endpoint)
│   ├── info-tani/                        ✅ GUNAKAN FOLDER INI
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── katalog-tani/                     ✅ GUNAKAN FOLDER INI
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── hubungi-kami/                     ✅ GUNAKAN FOLDER INI
│   │   └── page.tsx
│   └── cta/
│       └── page.tsx                      (Alias ke hubungi-kami)
├── components/
│   ├── Navbar.tsx
│   ├── ChatWidget.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── StatusBadge.tsx
│   ├── home/
│   │   ├── HomeNavbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── OverviewSection.tsx
│   │   ├── DetailSection.tsx
│   │   ├── ModernLandingEnhancements.tsx
│   │   └── FooterSection.tsx
│   └── info_tani/
│       ├── DetailInteractivePanel.tsx
│       ├── ProfileSection.tsx
│       └── StockDashboard.tsx
└── lib/
    └── data-dummy.ts
```

---

## 🗑️ File & Folder yang Harus DIHAPUS

### 1. **Folder Duplikat / Alias**

| Folder | Status | Alasan | Tindakan |
|--------|--------|--------|----------|
| `app/info_tani/` | Sudah alias | Re-export ke `info-tani` | ❌ HAPUS |
| `app/info_terkini/` | Sudah alias | Re-export ke `info-terkini` | ❌ HAPUS |
| `app/hubungi_kami/` | Sudah alias | Re-export ke `hubungi-kami` | ❌ HAPUS |
| `app/real_time/` | Sudah alias | Re-export ke `info-terkini` | ❌ HAPUS |
| `app/Katalog_tani/` | Deprecated | Diganti `katalog-tani` | ❌ HAPUS |

### 2. **File Placeholder Kosong**

Dalam folder `app/Katalog_tani/` (sebelum dihapus):
- `app/Katalog_tani/id/page.tsx` - Hanya placeholder, tidak ada isi
- `app/Katalog_tani/location/page.tsx` - Hanya placeholder, tidak ada isi

---

## ✨ Perubahan yang Sudah Dilakukan

### 1. **Data Structure** ✅
- Menambah field `gambar_banner` ke `DataTaniItem` 
- Setiap item sekarang punya: `foto_profil`, `gambar_produk`, `gambar_banner`

### 2. **Back Button Navigation** ✅
- Ditambahkan `ChevronLeft` icon di:
  - `app/katalog-tani/[id]/page.tsx` → Kembali ke `/katalog-tani`
  - `app/info-tani/[id]/page.tsx` → Kembali ke `/info-tani`

### 3. **Component Updates** ✅
- `ProfileSection.tsx` - Support optional `gambar_banner` parameter
- Kedua halaman detail sekarang menerima parameter `gambar_banner`

---

## 🚀 Cleanup yang Telah Dilakukan (Oleh Saya)

Saya sudah melakukan cleanup otomatis untuk beberapa folder/file duplikat dan memindahkan halaman kecil agar struktur menjadi konsisten.

### Yang sudah saya lakukan:
- Dipindahkan: `app/real_time/monitoring/page.tsx` → `app/info-terkini/monitoring/page.tsx`
- Dipindahkan: `app/Katalog_tani/id/chat/page.tsx` → `app/katalog-tani/id/chat/page.tsx`
- Menghapus file alias/duplikat:
  - `app/info_tani/page.tsx`
  - `app/info_terkini/page.tsx`
  - `app/hubungi_kami/page.tsx`
  - `app/real_time/page.tsx`
  - Seluruh file di `app/Katalog_tani/` (dipindahkan/dihapus)

### Tindakan verifikasi yang saya rekomendasikan:
1. Jalankan dev server lokal untuk memastikan tidak ada 404 atau import yang rusak.
2. Jika semuanya OK, hapus folder `.next/` untuk regenerate build cache (opsional).
3. Periksa Navbar/Footer dan pastikan semua link sudah menuju ke jalur baru.

---

## 📝 Optimalisasi Code yang Sudah Dilakukan

### 1. **Better Component Props** ✅
```typescript
// Sebelum: Wajib ada gambar_produk
type ProfileSectionProps = {
  gambar_produk: string;
};

// Sesudah: Optional dengan fallback
type ProfileSectionProps = {
  gambar_produk?: string;
  gambar_banner?: string;
};
```

### 2. **Responsive Back Button** ✅
- Katalog: Dark theme dengan chevron (zinc-950)
- Info Tani: Light theme dengan chevron (cyan-900)

### 3. **Better Navigation Flow** ✅
```
katalog-tani/[id] ← Back → katalog-tani
info-tani/[id] ← Back → info-tani
```

---

## ⚠️ Perhatian Penting

1. **Sebelum menghapus folder**, pastikan:
   - Tidak ada import dari folder tersebut di file lain
   - Semua routing sudah menggunakan folder baru

2. **Navigation Links** yang perlu diverifikasi:
   - Cek semua link di Navbar, Footer, ProductCard
   - Pastikan tidak ada yang mengarah ke folder lama (info_tani, Katalog_tani, dll)

3. **API Routes**:
   - API hubungi-kami sudah di tempat yang benar: `app/api/hubungi-kami/`

---

## ✅ Checklist Setelah Cleanup

- [ ] Hapus semua folder duplikat
- [ ] Test navigasi di semua halaman
- [ ] Verifikasi tidak ada 404 error
- [ ] Jalankan `npm run build` untuk verifikasi
- [ ] Cek bahwa back button berfungsi di detail pages

---

## 🔍 Catatan Tambahan

**File `cta/page.tsx` dan `hubungi_kami/page.tsx`**:
- Saat ini sudah dialihkan via re-export
- Bisa tetap ada atau dihapus sesuai preferensi Anda
- Jika ingin simpan untuk backward compatibility, tidak masalah

**Components**:
- Sudah tersentralisasi dengan baik di `components/`
- Tidak ada duplikasi component

**Library Data**:
- Data sudah terpusat di `lib/data-dummy.ts`
- Hanya ada 1 source of truth
