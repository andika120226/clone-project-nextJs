"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, Mail, Phone, UserRound } from "lucide-react";
import {
  CustomerAccount,
  saveCustomer,
  saveSession,
  saveToken,
} from "@/lib/customer-store";

type CustomerAuthFormProps = {
  mode: "login" | "signup";
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function CustomerAuthForm({ mode }: CustomerAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/profile";
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const title = useMemo(
    () => (isSignup ? "Daftar Customer" : "Login Customer"),
    [isSignup],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const email = form.email.trim().toLowerCase();

    void (async () => {
      try {
        if (isSignup) {
          if (!form.name.trim() || !email || !form.phone.trim()) {
            setError("Lengkapi nama, email, dan nomor telepon.");
            return;
          }

          if (form.password.trim().length < 6) {
            setError("Password minimal 6 karakter.");
            return;
          }

          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name.trim(),
              email,
              phone: form.phone.trim(),
              password: form.password.trim(),
              role: "CUSTOMER",
            }),
          });

          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload?.error || "Gagal mendaftarkan akun customer.");
          }

          const user = payload.user as { id: string; name: string; email: string; phone?: string };
          const token = payload.token as string;
          const account: CustomerAccount = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: form.phone.trim(),
            password: form.password.trim(),
            createdAt: new Date().toISOString(),
          };

          saveCustomer(account);
          saveToken(token);
          saveSession({
            id: user.id,
            email: user.email,
            name: user.name,
            token: token,
            createdAt: new Date().toISOString(),
          });
          setSuccess("Akun customer berhasil dibuat.");
          router.push(nextUrl);
          return;
        }

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: form.password.trim() }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Email atau password tidak cocok.");
        }

        const user = payload.user as { id: string; name: string; email: string; phone?: string };
        const token = payload.token as string;
        const account: CustomerAccount = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          password: form.password.trim(),
          createdAt: new Date().toISOString(),
        };

        saveCustomer(account);
        saveToken(token);
        saveSession({
          id: user.id,
          email: user.email,
          name: user.name,
          token: token,
          createdAt: new Date().toISOString(),
        });
        setSuccess("Login berhasil.");
        router.push(nextUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(message);
      }
    })();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignup && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Nama Lengkap
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <UserRound className="h-4 w-4 text-cyan-700" />
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Nama customer"
            />
          </div>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </span>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Mail className="h-4 w-4 text-cyan-700" />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="customer@email.com"
          />
        </div>
      </label>

      {isSignup && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Nomor Telepon
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Phone className="h-4 w-4 text-cyan-700" />
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </span>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <KeyRound className="h-4 w-4 text-cyan-700" />
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={isSignup ? "Minimal 6 karakter" : "Masukkan password"}
          />
        </div>
      </label>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500"
      >
        {title}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
