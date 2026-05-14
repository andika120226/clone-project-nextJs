"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFarmerProfile, saveFarmerProfile } from "@/lib/admin-store";
import { useAdminTenant } from "@/components/admin/useAdminTenant";

type ProfileForm = {
  farmerName: string;
  profilePhoto: string;
  catalogBanner: string;
  description: string;
  latitude: number;
  longitude: number;
};

const initialForm: ProfileForm = {
  farmerName: "",
  profilePhoto: "",
  catalogBanner: "",
  description: "",
  latitude: -5.429,
  longitude: 105.262,
};

export default function AdminProfilePage() {
  const router = useRouter();
  const { ready, session } = useAdminTenant();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const profile = getFarmerProfile(session.tenantId);
    if (!profile) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      farmerName: profile.farmerName,
      profilePhoto: profile.profilePhoto,
      catalogBanner: profile.catalogBanner,
      description: profile.description,
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
  }, [ready, router, session]);

  function readAsDataUrl(file: File, callback: (value: string) => void) {
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!session) {
      return;
    }

    saveFarmerProfile(session.tenantId, {
      farmerName: form.farmerName,
      profilePhoto: form.profilePhoto,
      catalogBanner: form.catalogBanner,
      description: form.description,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    });
    setSavedMessage("Profil petani berhasil diperbarui.");
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Profil Petani</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pengaturan Identitas Tenant</h1>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-700">Latitude</span>
              <input
                type="number"
                step={0.0001}
                value={form.latitude}
                onChange={(event) => setForm((prev) => ({ ...prev, latitude: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-700">Longitude</span>
              <input
                type="number"
                step={0.0001}
                value={form.longitude}
                onChange={(event) => setForm((prev) => ({ ...prev, longitude: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5"
              />
            </label>
          </div>

          <button type="button" onClick={handleSave} className="rounded-xl bg-cyan-600 px-4 py-2.5 font-semibold text-white">
            Simpan Profil
          </button>
          {savedMessage && <p className="text-sm text-emerald-700">{savedMessage}</p>}
        </article>

        <article className="rounded-3xl border border-white/80 bg-white/65 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Foto Profil</p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              title="Upload foto profil petani"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                readAsDataUrl(file, (value) => setForm((prev) => ({ ...prev, profilePhoto: value })));
              }}
              className="mt-2 w-full"
            />
            {form.profilePhoto && (
              <img src={form.profilePhoto} alt="Foto profil petani" className="mt-3 h-40 w-full rounded-2xl object-cover" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Banner Katalog</p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              title="Upload banner katalog"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                readAsDataUrl(file, (value) => setForm((prev) => ({ ...prev, catalogBanner: value })));
              }}
              className="mt-2 w-full"
            />
            {form.catalogBanner && (
              <img src={form.catalogBanner} alt="Banner katalog" className="mt-3 h-40 w-full rounded-2xl object-cover" />
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
            <iframe
              title="Lokasi Lahan"
              src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=13&output=embed`}
              className="h-56 w-full"
              loading="lazy"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
