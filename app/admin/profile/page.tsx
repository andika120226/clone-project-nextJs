"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminTenant } from "@/components/admin/useAdminTenant";
import ImageUploadModal from "@/components/ImageUploadModal";
import { buildGoogleMapsFallbackUrl } from "@/lib/google-maps";

interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  panTo(latlng: [number, number]): LeafletMap;
  on(event: string, fn: (e: LeafletMouseEvent) => void): LeafletMap;
}

interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  setLatLng(latlng: [number, number]): LeafletMarker;
  getLatLng(): { lat: number; lng: number };
  on(event: string, fn: () => void): LeafletMarker;
}

interface LeafletMouseEvent {
  latlng: { lat: number; lng: number };
}

interface LeafletGlobal {
  map(id: string): LeafletMap;
  tileLayer(url: string, options: Record<string, unknown>): { addTo(map: LeafletMap): void };
  divIcon(options: Record<string, unknown>): unknown;
  marker(center: [number, number], options: Record<string, unknown>): LeafletMarker;
}

type ProfileForm = {
  farmerName: string;
  profilePhoto: string;
  catalogBanner: string;
  description: string;
  catalogMapUrl: string;
  latitude: number;
  longitude: number;
  bankName: string;
  accountNumber: string;
};

type SavedProfileMeta = {
  updatedAt: string | null;
};

const initialForm: ProfileForm = {
  farmerName: "",
  profilePhoto: "",
  catalogBanner: "",
  description: "",
  catalogMapUrl: "",
  latitude: -5.429,
  longitude: 105.262,
  bankName: "",
  accountNumber: "",
};

export default function AdminProfilePage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileMeta, setProfileMeta] = useState<SavedProfileMeta>({ updatedAt: null });
  const [resolvedMapUrl, setResolvedMapUrl] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalType, setImageModalType] = useState<"profile" | "banner">("profile");

  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [geoError, setGeoError] = useState("");

  const initialCenterRef = useRef<[number, number] | null>(null);
  if (!initialCenterRef.current && Number.isFinite(form.latitude) && Number.isFinite(form.longitude)) {
    initialCenterRef.current = [form.latitude, form.longitude];
  }

  // Load Leaflet CDN script and stylesheet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    const globalL = (window as unknown as { L?: LeafletGlobal }).L;
    if (globalL) {
      setIsLeafletLoaded(true);
      return;
    }

    const cssId = "leaflet-cdn-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-cdn-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        const gL = (window as unknown as { L?: LeafletGlobal }).L;
        if (gL) {
          setIsLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize Leaflet map picker
  useEffect(() => {
    if (!isLeafletLoaded) return;
    if (typeof window === "undefined") return;
    const L = (window as unknown as { L?: LeafletGlobal }).L;
    if (!L) return;

    const center = initialCenterRef.current || [-5.429, 105.262];

    if (!mapRef.current) {
      const map = L.map("admin-leaflet-map").setView(center, 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
          <div class="absolute h-8 w-8 animate-ping rounded-full bg-rose-400 opacity-75"></div>
          <div class="relative rounded-full bg-rose-600 p-2 shadow-lg border-2 border-white">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>`,
        className: "custom-div-icon",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker(center, {
        draggable: true,
        icon: customIcon
      }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setForm((prev) => ({
          ...prev,
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6))
        }));
      });

      map.on("click", (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setForm((prev) => ({
          ...prev,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6))
        }));
      });
    }
  }, [isLeafletLoaded]);

  // Synchronize coordinates from form input to Leaflet marker/view
  useEffect(() => {
    if (!isLeafletLoaded || !mapRef.current || !markerRef.current) return;

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const currentLatLng = markerRef.current.getLatLng();
    if (Math.abs(currentLatLng.lat - lat) > 0.00001 || Math.abs(currentLatLng.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng]);
    }
  }, [form.latitude, form.longitude, isLeafletLoaded]);

  // Handle HTML5 GPS Geolocation
  function handleGetMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setGeoError("");
        setSavedMessage("Berhasil mendeteksi lokasi saat ini.");
      },
      (error) => {
        let msg = "Gagal mendeteksi lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin lokasi ditolak oleh pengguna.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informasi lokasi tidak tersedia.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu permintaan lokasi habis.";
        }
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const profileChecklist = [
    Boolean(form.farmerName),
    Boolean(form.description),
    Boolean(form.profilePhoto),
    Boolean(form.catalogBanner),
    Boolean(form.catalogMapUrl),
    Number.isFinite(form.latitude) && Number.isFinite(form.longitude),
  ];
  const profileProgress = Math.round(Math.min(100, (profileChecklist.filter(Boolean).length / profileChecklist.length) * 100));

  const updatedAtLabel = profileMeta.updatedAt
    ? new Date(profileMeta.updatedAt).toLocaleString("id-ID")
    : "Belum pernah disimpan";

  function getProgressWidthClass(progress: number) {
    if (progress <= 0) return "w-0";
    if (progress <= 20) return "w-1/5";
    if (progress <= 40) return "w-2/5";
    if (progress <= 60) return "w-3/5";
    if (progress <= 80) return "w-4/5";
    return "w-full";
  }

  async function persistProfile(nextForm: ProfileForm, successMessage: string) {
    if (!session) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-farmer-id": session.tenantId,
        },
        body: JSON.stringify({
          farmerName: nextForm.farmerName.trim() || session.name,
          profilePhoto: nextForm.profilePhoto,
          catalogBanner: nextForm.catalogBanner,
          description: nextForm.description,
          catalogMapUrl: nextForm.catalogMapUrl,
          latitude: Number(nextForm.latitude),
          longitude: Number(nextForm.longitude),
          bankName: nextForm.bankName.trim(),
          accountNumber: nextForm.accountNumber.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menyimpan profil petani.");
      }

      const savedProfile = payload?.data ?? {};
      const nextResolvedMapUrl = String(savedProfile?.catalogMapUrl || nextForm.catalogMapUrl || "").trim();

      setForm({
        farmerName: (savedProfile?.farmerName ?? nextForm.farmerName) || "",
        profilePhoto: (savedProfile?.profilePhoto ?? nextForm.profilePhoto) || "",
        catalogBanner: (savedProfile?.catalogBanner ?? nextForm.catalogBanner) || "",
        description: (savedProfile?.description ?? nextForm.description) || "",
        catalogMapUrl: nextResolvedMapUrl || "",
        latitude: Number(savedProfile?.latitude ?? nextForm.latitude),
        longitude: Number(savedProfile?.longitude ?? nextForm.longitude),
        bankName: (savedProfile?.bankName ?? nextForm.bankName) || "",
        accountNumber: (savedProfile?.accountNumber ?? nextForm.accountNumber) || "",
      });
      setResolvedMapUrl(nextResolvedMapUrl || buildGoogleMapsFallbackUrl(nextForm.latitude, nextForm.longitude));
      setProfileMeta({ updatedAt: savedProfile?.updatedAt ?? new Date().toISOString() });
      setSavedMessage(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan profil petani.";
      setSavedMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    void (async () => {
      const response = await fetch("/api/admin/profile", {
        headers: {
          "x-farmer-id": session.tenantId,
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const profile = payload?.data;

      setForm({
        farmerName: profile?.farmerName || session.name || "",
        profilePhoto: profile?.profilePhoto || "",
        catalogBanner: profile?.catalogBanner || "",
        description: profile?.description || "",
        catalogMapUrl: profile?.catalogMapUrl || "",
        latitude: Number(profile?.latitude ?? initialForm.latitude),
        longitude: Number(profile?.longitude ?? initialForm.longitude),
        bankName: profile?.bankName || "",
        accountNumber: profile?.accountNumber || "",
      });
      setResolvedMapUrl(
        profile?.catalogMapUrl ||
          buildGoogleMapsFallbackUrl(
            Number(profile?.latitude ?? initialForm.latitude),
            Number(profile?.longitude ?? initialForm.longitude),
          ),
      );
      setProfileMeta({ updatedAt: profile?.updatedAt ?? null });
    })();
  }, [ready, router, session]);

  useEffect(() => {
    if (!ready || !session) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/maps/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: form.catalogMapUrl,
              latitude: form.latitude,
              longitude: form.longitude,
            }),
            signal: controller.signal,
          });

          const payload = await response.json();
          if (!controller.signal.aborted) {
            setResolvedMapUrl(payload?.data?.embedUrl || buildGoogleMapsFallbackUrl(form.latitude, form.longitude));
          }
        } catch {
          if (!controller.signal.aborted) {
            setResolvedMapUrl(buildGoogleMapsFallbackUrl(form.latitude, form.longitude));
          }
        }
      })();
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form.catalogMapUrl, form.latitude, form.longitude, ready, session]);

  function handleImageUploadModal(imageUrl: string) {
    const nextForm =
      imageModalType === "profile"
        ? { ...form, profilePhoto: imageUrl }
        : { ...form, catalogBanner: imageUrl };

    if (imageModalType === "profile") {
      setForm((prev) => ({ ...prev, profilePhoto: imageUrl }));
    } else {
      setForm((prev) => ({ ...prev, catalogBanner: imageUrl }));
    }
    setImageModalOpen(false);

    void persistProfile(
      nextForm,
      imageModalType === "profile"
        ? "Foto profil tersimpan di database."
        : "Banner katalog tersimpan di database.",
    );
  }

  async function handleSave() {
    await persistProfile(form, "Profil petani berhasil diperbarui.");
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/60 bg-white/35 px-6 py-10 shadow-[0_24px_60px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div className="relative flex flex-col items-center gap-4 rounded-[28px] border border-cyan-200/70 bg-white/55 px-8 py-10 text-center shadow-[0_18px_40px_rgba(2,132,199,0.12)] backdrop-blur-lg">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <div className="space-y-2">
            <div className="mx-auto h-4 w-56 animate-pulse rounded-full bg-cyan-100/80" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-sky-100/80" />
          </div>
          <p className="text-sm font-medium text-slate-600">Menyiapkan profil Aqua Sky...</p>
        </div>
      </div>
    );
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Profil Petani</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pengaturan Identitas Tenant</h1>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Progress profil</span>
            <span className="font-semibold text-cyan-700">{profileProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-cyan-100">
            <div className={`h-2 rounded-full bg-cyan-600 transition-all ${getProgressWidthClass(profileProgress)}`} />
          </div>
          <p className="text-xs text-slate-500">Terakhir tersimpan: {updatedAtLabel}</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-3xl border border-white/80 bg-white/65 p-5 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-700">Nama Petani</span>
            <input
              value={form.farmerName}
              onChange={(event) => setForm((prev) => ({ ...prev, farmerName: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Deskripsi</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 min-h-28 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Google Maps URL</span>
            <input
              value={form.catalogMapUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, catalogMapUrl: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5"
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="mt-1 text-xs text-slate-500">Tempelkan URL embed Google Maps atau link lokasi yang ingin ditampilkan di katalog.</p>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-slate-700 font-semibold">Latitude</span>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => setForm((prev) => ({ ...prev, latitude: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-slate-900 focus:border-cyan-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700 font-semibold">Longitude</span>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => setForm((prev) => ({ ...prev, longitude: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-slate-900 focus:border-cyan-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGetMyLocation}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 transition shadow-sm"
            >
              📍 Gunakan Lokasi Saya Saat Ini
            </button>
            {geoError && <p className="text-xs text-rose-600 font-medium">{geoError}</p>}
          </div>

          <hr className="border-cyan-100" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Pengaturan Rekening Pembayaran</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-700 font-semibold">Nama Bank / Layanan</span>
                <select
                  value={form.bankName}
                  onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-slate-900 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="BSI">BSI</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-slate-700 font-semibold">Nomor Rekening</span>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                  placeholder="Masukkan no rekening"
                  className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-slate-900 focus:border-cyan-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <hr className="border-cyan-100" />

          <button type="button" onClick={handleSave} className="rounded-xl bg-cyan-600 px-4 py-2.5 font-semibold text-white" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Profil"}
          </button>
          {savedMessage && <p className="text-sm text-emerald-700">{savedMessage}</p>}
        </article>

        <article className="rounded-3xl border border-white/80 bg-white/65 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Foto Profil</p>
            <button
              type="button"
              onClick={() => {
                setImageModalType("profile");
                setImageModalOpen(true);
              }}
              className="mt-3 inline-block rounded-lg bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition"
            >
              {form.profilePhoto ? "Ubah Foto Profil" : "Tambahkan Foto Profil"}
            </button>
            {form.profilePhoto && (
              <div className="mt-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.profilePhoto} alt="Foto profil petani" className="h-40 w-full rounded-2xl object-cover" />
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                  <span>Foto profil</span>
                  <span className="font-semibold">Tersimpan di database</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Banner Katalog</p>
            <button
              type="button"
              onClick={() => {
                setImageModalType("banner");
                setImageModalOpen(true);
              }}
              className="mt-3 inline-block rounded-lg bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition"
            >
              {form.catalogBanner ? "Ubah Banner Katalog" : "Tambahkan Banner Katalog"}
            </button>
            {form.catalogBanner && (
              <div className="mt-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.catalogBanner} alt="Banner katalog" className="h-40 w-full rounded-2xl object-cover" />
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                  <span>Banner katalog</span>
                  <span className="font-semibold">Tersimpan di database</span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
            {isLeafletLoaded ? (
              <div id="admin-leaflet-map" className="h-56 w-full z-10" />
            ) : (
              <iframe
                title="Lokasi Lahan"
                src={resolvedMapUrl || buildGoogleMapsFallbackUrl(form.latitude, form.longitude)}
                className="h-56 w-full"
                loading="lazy"
              />
            )}
          </div>
        </article>
      </div>

      <ImageUploadModal
        isOpen={imageModalOpen}
        title={imageModalType === "profile" ? "Ubah Foto Profil" : "Ubah Banner Katalog"}
        initialImage={imageModalType === "profile" ? form.profilePhoto : form.catalogBanner}
        onClose={() => setImageModalOpen(false)}
        onConfirm={handleImageUploadModal}
      />
    </section>
  );
}
