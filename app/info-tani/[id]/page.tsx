"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Warehouse } from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";
import {
  getAdminAccountByCatalogId,
  getFarmerProfile,
  getPriceByProductName,
  getTenantCatalog,
  getTenantProducts,
} from "@/lib/admin-store";
import DetailInteractivePanel from "@/components/info_tani/DetailInteractivePanel";
import ProfileSection from "@/components/info_tani/ProfileSection";
import StockDashboard from "@/components/info_tani/StockDashboard";

function unitPriceByProduct(productName: string) {
  const lower = productName.toLowerCase();
  if (lower.includes("kopi")) {
    return 62000;
  }
  if (lower.includes("cabai")) {
    return 36000;
  }
  if (lower.includes("padi")) {
    return 13000;
  }
  if (lower.includes("jagung")) {
    return 9800;
  }
  return 15000;
}

const bankNames = ["BCA", "Mandiri", "BNI", "BRI", "BSI"];

function getAccountNumber(seed: string) {
  let value = 0;

  for (const character of seed) {
    value = (value * 31 + character.charCodeAt(0)) % 1000000000;
  }

  return `8${String(value).padStart(9, "0")}`.slice(0, 10);
}

function resolveSlotId(rawId: string) {
  const numericId = Number(rawId);
  if (Number.isInteger(numericId) && numericId >= 1 && numericId <= 15) {
    return numericId;
  }

  const legacyIndex = DATA_TANI.findIndex((item) => item.id === rawId);
  if (legacyIndex >= 0) {
    return legacyIndex + 1;
  }

  return null;
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function InfoTaniDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id ?? "";
  const isHydrated = useIsHydrated();

  const viewModel = useMemo(() => {
    const slotId = resolveSlotId(rawId);
    if (!slotId) {
      return null;
    }

    const catalog = getTenantCatalog(slotId);
    const account = isHydrated ? getAdminAccountByCatalogId(slotId) : null;
    const profile = account ? getFarmerProfile(account.tenantId) : null;
    const products = account ? getTenantProducts(account.tenantId) : [];
    const primaryProduct = products[0] ?? null;
    const legacyProduct = DATA_TANI.find((item) => item.id === rawId) ?? null;

    const farmerName = profile?.farmerName || account?.name || legacyProduct?.nama_petani || catalog.name;
    const productName = primaryProduct?.name || legacyProduct?.nama_produk || "Produk belum diatur";
    const unitPrice = primaryProduct?.pricePerKg || getPriceByProductName(productName) || unitPriceByProduct(productName);
    const bankName = bankNames[(slotId - 1) % bankNames.length];
    const accountNumber = getAccountNumber(`${catalog.code}-${farmerName}-${productName}`);
    const profilePhoto = profile?.profilePhoto || legacyProduct?.foto_profil || "";
    const bannerImage = profile?.catalogBanner || legacyProduct?.gambar_banner || primaryProduct?.imageUrl || "";
    const productImage = primaryProduct?.imageUrl || legacyProduct?.gambar_produk || "";
    const location = profile?.latitude && profile?.longitude
      ? `Koordinat ${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`
      : legacyProduct?.lokasi || catalog.region;
    const stockItems = products.map((product, index) => ({
      id: product.id,
      nama_komoditas: product.name || `Produk ${index + 1}`,
      stok_kg: product.stockKg,
      satuan: "kg",
      harga_per_unit: product.pricePerKg || unitPriceByProduct(product.name || productName),
      status:
        product.stockStatus === "Ready"
          ? "siap"
          : product.stockKg <= 0
            ? "habis"
            : "menipis",
      gambar: product.imageUrl || "",
    }));

    const checkoutProducts = products.length > 0
      ? products.map((product) => ({
          id: product.id,
          name: product.name,
          unitPrice: product.pricePerKg || unitPriceByProduct(product.name),
          stockKg: product.stockKg,
          imageUrl: product.imageUrl || "",
        }))
      : [{
          id: primaryProduct?.id ?? legacyProduct?.id ?? rawId,
          name: productName,
          unitPrice,
          stockKg: legacyProduct?.stok ?? 0,
          imageUrl: productImage,
        }];

    const productId = primaryProduct?.id ?? legacyProduct?.id ?? rawId;
    const tenantId = account?.tenantId ?? `tenant-${slotId}`;

    return {
      slotId,
      catalog,
      farmerName,
      productName,
      unitPrice,
      bankName,
      accountNumber,
      profilePhoto,
      bannerImage,
      productImage,
      location,
      stockItems,
      productId,
      tenantId,
      checkoutProducts,
    };
  }, [isHydrated, rawId]);

  if (!viewModel) {
    return (
      <main className="min-h-screen bg-cyan-100/55 pb-16 pt-4">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-0">
          <Link
            href="/info-tani"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-200/60 px-4 py-2 text-sm font-medium text-cyan-900 transition hover:bg-cyan-200/80 hover:text-cyan-950"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Info Tani
          </Link>
        </div>
        <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-cyan-200 bg-white p-6 text-slate-700 shadow-sm">
          Slot katalog tidak ditemukan.
        </section>
      </main>
    );
  }

  const {
    catalog,
    farmerName,
    productName,
    unitPrice,
    bankName,
    accountNumber,
    profilePhoto,
    bannerImage,
    productImage,
    location,
    stockItems,
    productId,
    tenantId,
    checkoutProducts,
  } = viewModel;

  return (
    <main className="min-h-screen bg-cyan-100/55 pb-16 pt-4">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-0">
        <Link
          href="/info-tani"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-200/60 px-4 py-2 text-sm font-medium text-cyan-900 transition hover:bg-cyan-200/80 hover:text-cyan-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Info Tani
        </Link>
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-cyan-200 bg-cyan-100/70 p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="rounded-3xl border border-cyan-200 bg-white/85 px-5 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">
            {catalog.code}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {catalog.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {catalog.region === "Belum diatur"
              ? "Slot ini masih kosong. Admin dapat mengisi profil petani, produk, foto, dan banner melalui dashboard."
              : "Data katalog ini mengikuti konfigurasi terbaru dari dashboard admin."}
          </p>
        </div>

        <ProfileSection
          nama_petani={farmerName}
          lokasi={location}
          foto_profil={profilePhoto}
          gambar_produk={productImage}
          gambar_banner={bannerImage}
          nama_produk={productName}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <StockDashboard items={stockItems} />

          <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <Warehouse className="h-5 w-5 text-cyan-700" />
              <h2 className="text-lg font-semibold">Ringkasan Katalog</h2>
            </div>
            <p className="text-sm text-slate-600">
              Bagian ini mengikuti data tenant yang tersimpan, sehingga perubahan di dashboard langsung tercermin di katalog publik.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-100 bg-slate-100">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  width={1200}
                  height={720}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center bg-linear-to-br from-cyan-50 to-white text-sm font-semibold text-slate-500">
                  Gambar produk belum diatur
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Slot katalog {catalog.code} siap diisi dari menu produk dan profil admin.
            </p>
          </section>
        </div>

        <DetailInteractivePanel
          key={`${catalog.code}-${checkoutProducts.map((item) => item.id).join("_")}`}
          productId={productId}
          farmerName={farmerName}
          productName={productName}
          unitPrice={unitPrice}
          bankName={bankName}
          accountNumber={accountNumber}
          accountHolder={farmerName}
          tenantId={tenantId}
          catalogCode={catalog.code}
          productImage={productImage}
          availableProducts={checkoutProducts}
        />

        <div>
          <Link
            href="/info-tani"
            className="inline-flex rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </section>
    </main>
  );
}
