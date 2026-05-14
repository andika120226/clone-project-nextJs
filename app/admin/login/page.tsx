"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignCatalogForEmail,
  getTenantCatalog,
  saveAdminSession,
  saveAdminAccount,
  validateAdminLogin,
} from "@/lib/admin-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.includes("@") || password.length < 6) {
      setError("Masukkan kredensial admin yang valid.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isRegisterMode && name.trim().length < 2) {
      setError("Nama admin minimal 2 karakter.");
      return;
    }

    if (!isRegisterMode) {
      const found = validateAdminLogin(normalizedEmail, password);
      if (!found) {
        setError("Akun tidak ditemukan atau password salah.");
        return;
      }

      saveAdminSession(found);
      router.push("/admin");
      return;
    }

    const assigned = assignCatalogForEmail(normalizedEmail);
    const account = saveAdminAccount({
      name: name.trim(),
      email: normalizedEmail,
      password,
      assignedCatalogId: assigned.id,
    });
    saveAdminSession(account);
    setSuccess(
      `Akun berhasil dibuat dan terhubung ke ${getTenantCatalog(account.assignedCatalogId).name}.`,
    );
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-3xl border border-white/80 bg-white/60 p-6 shadow-[0_24px_56px_rgba(8,145,178,0.2)] backdrop-blur-xl"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Admin Area</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">
            {isRegisterMode ? "Daftar Admin Petani" : "Login Admin"}
          </h1>
          <p className="text-sm text-slate-600">
            Masuk untuk mengelola katalog, pesanan, history, monitoring, dan profil petani.
          </p>
        </div>

        {isRegisterMode && (
          <div>
            <label className="block text-sm text-slate-700">Nama Petani</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5 outline-none focus:border-cyan-400"
              placeholder="Nama akun admin"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@infotani.id"
            title="Email admin"
            className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            title="Password admin"
            className="mt-1 w-full rounded-xl border border-cyan-100 bg-white/90 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsRegisterMode((prev) => !prev)}
            className="rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700"
          >
            {isRegisterMode ? "Sudah punya akun? Login" : "Buat akun admin"}
          </button>
          <button className="rounded-xl bg-cyan-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/20">
            {isRegisterMode ? "Daftar & Masuk" : "Masuk"}
          </button>
        </div>
      </form>
    </main>
  );
}
