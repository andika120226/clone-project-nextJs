"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, MapPin, Warehouse } from "lucide-react";
import {
  getAdminAccountByCatalogId,
  getTenantCatalog,
} from "@/lib/admin-store";
import DetailInteractivePanel from "@/components/info_tani/DetailInteractivePanel";
import ProfileSection from "@/components/info_tani/ProfileSection";
import StockDashboard from "@/components/info_tani/StockDashboard";
import { buildGoogleMapsFallbackUrl, normalizeGoogleMapsEmbedUrl } from "@/lib/google-maps";

type RemoteProfile = {
  farmerName: string;
  profilePhoto: string | null;
  catalogBanner: string | null;
  description: string | null;
  catalogMapUrl: string | null;
  latitude: number;
  longitude: number;
  bankName?: string | null;
  accountNumber?: string | null;
};

type RemoteProduct = {
  id: string;
  name: string;
  pricePerKg: number;
  stockKg: number;
  imageUrl: string;
  stockStatus: "Ready" | "Menipis";
};

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
  const [remoteProfile, setRemoteProfile] = useState<RemoteProfile | null>(null);
  const [remoteProducts, setRemoteProducts] = useState<RemoteProduct[]>([]);
  const [customerCoords, setCustomerCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const viewModel = (() => {
    const slotId = resolveSlotId(rawId);
    if (!slotId) {
      return null;
    }

    const catalog = getTenantCatalog(slotId);
    const account = isHydrated ? getAdminAccountByCatalogId(slotId) : null;
    const profile = remoteProfile;
    const products = remoteProducts;
    const primaryProduct = products[0] ?? null;

    const farmerName = profile?.farmerName || catalog.name;
    const productName = primaryProduct?.name || "Produk belum diatur";
    const unitPrice = primaryProduct?.pricePerKg ?? unitPriceByProduct(productName);
    const bankName = profile?.bankName?.trim() || bankNames[(slotId - 1) % bankNames.length];
    const accountNumber = profile?.accountNumber?.trim() || getAccountNumber(`${catalog.code}-${farmerName}-${productName}`);
    const profilePhoto = profile?.profilePhoto || "";
    const bannerImage = profile?.catalogBanner || primaryProduct?.imageUrl || "";
    const productImage = primaryProduct?.imageUrl || "";
    const mapUrl =
      normalizeGoogleMapsEmbedUrl(
        profile?.catalogMapUrl,
      ) ||
      buildGoogleMapsFallbackUrl(
        profile?.latitude ?? -5.429,
        profile?.longitude ?? 105.262,
      );
    const location = profile && profile.latitude && profile.longitude
      ? `Koordinat ${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`
      : catalog.region;
    const stockItems = products.map((product, index) => ({
      id: product.id,
      nama_komoditas: product.name || `Produk ${index + 1}`,
      stok_kg: product.stockKg,
      satuan: "kg",
      harga_per_unit: product.pricePerKg || unitPriceByProduct(product.name || productName),
      status: (
        product.stockStatus === "Ready"
          ? "siap"
          : product.stockKg <= 0
            ? "habis"
            : "menipis"
      ) as "habis" | "menipis" | "siap",
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
      : [];

    const productId = primaryProduct?.id ?? rawId;
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
      mapUrl,
      location,
      stockItems,
      productId,
      tenantId,
      checkoutProducts,
    };
  })();

  useEffect(() => {
    const slotId = resolveSlotId(rawId);
    if (!isHydrated || !slotId) {
      return;
    }

    const account = getAdminAccountByCatalogId(slotId);
    if (!account) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [profileResponse, productsResponse] = await Promise.all([
          fetch("/api/admin/profile", {
            headers: { "x-farmer-id": account.tenantId },
          }),
          fetch(`/api/admin/products?tenantId=${account.tenantId}`, {
            headers: { "x-farmer-id": account.tenantId },
          }),
        ]);

        const profilePayload = profileResponse.ok ? await profileResponse.json() : null;
        const productsPayload = productsResponse.ok ? await productsResponse.json() : null;

        if (cancelled) {
          return;
        }

        setRemoteProfile(profilePayload?.data ?? null);
        setRemoteProducts(Array.isArray(productsPayload?.data) ? productsPayload.data : []);
      } catch {
        if (!cancelled) {
          setRemoteProfile(null);
          setRemoteProducts([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, rawId]);

  // Request customer current browser coordinates
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log("Customer GPS denied/unavailable:", error.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Compute straight-line Haversine distance from customer current location to farmer land
  const distanceKm = (() => {
    if (!customerCoords || !remoteProfile) return null;
    const lat1 = customerCoords.latitude;
    const lon1 = customerCoords.longitude;
    const lat2 = remoteProfile.latitude;
    const lon2 = remoteProfile.longitude;

    if (lat2 === 0 && lon2 === 0) return null; // Skip if farmer coordinate is default 0,0

    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  })();

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
    mapUrl,
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
              <h2 className="text-lg font-semibold">Deskripsi Katalog</h2>
            </div>
            <p className="text-sm text-slate-600">
              {remoteProfile?.description?.trim() || "Admin belum mengisi deskripsi katalog ini."}
            </p>

            <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Jumlah produk</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{remoteProducts.length} item</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status katalog</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {remoteProducts.length > 0 ? "Siap untuk pembayaran" : "Belum ada produk"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Slot katalog {catalog.code} mengikuti data admin yang tersimpan di dashboard.
            </p>
          </section>
        </div>

        <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <MapPin className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-semibold">Lokasi Google Maps</h2>
          </div>
          <p className="text-sm text-slate-600">
            Peta ini mengikuti URL yang disimpan di profil admin.
          </p>
          {distanceKm !== null && (
            <div className="mt-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-900 flex items-center gap-2 font-medium">
              <span>📍</span>
              <span>Estimasi jarak dari lokasi Anda: <strong>{distanceKm.toFixed(1)} km</strong></span>
            </div>
          )}
          <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-100 bg-slate-100">
            <iframe
              title="Lokasi Google Maps"
              src={mapUrl}
              className="h-72 w-full"
              loading="lazy"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={remoteProfile?.catalogMapUrl || mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-700 shadow-sm"
            >
              🚗 Buka di Google Maps
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${remoteProfile?.latitude ?? -5.429},${remoteProfile?.longitude ?? 105.262}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
            >
              📍 Petunjuk Arah
            </a>
          </div>
        </section>

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
          farmerLatitude={remoteProfile?.latitude ?? undefined}
          farmerLongitude={remoteProfile?.longitude ?? undefined}
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
