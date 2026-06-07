"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sprout,
} from "lucide-react";

type StepId = 1 | 2 | 3;

type Role = "Petani" | "Distributor";

type FormState = {
  name: string;
  phone: string;
  role: Role;
  landArea: string;
  location: string;
  monthlyNeeds: string;
  commodity: string;
  notes: string;
};

type SubmitState = {
  status: "idle" | "loading" | "success";
  message: string;
};

const steps: { id: StepId; title: string; subtitle: string }[] = [
  { id: 1, title: "Biodata", subtitle: "Nama, telepon, dan role" },
  {
    id: 2,
    title: "Detail Kebutuhan",
    subtitle: "Spesifik untuk Petani / Distributor",
  },
  { id: 3, title: "Review", subtitle: "Tinjau sebelum kirim" },
];

const faqs = [
  {
    question: "Bagaimana keamanan pembayaran (VA/Escrow)?",
    answer:
      "Setiap pembayaran partnership dapat menggunakan rekening virtual atau skema escrow agar dana tetap aman sampai proses verifikasi komoditas selesai.",
  },
  {
    question: "Apakah logistik pengiriman dibantu?",
    answer:
      "Tim operasional InfoTani membantu koordinasi logistik pengiriman, penjadwalan armada, dan sinkronisasi stok untuk wilayah Bandar Lampung dan sekitarnya.",
  },
  {
    question: "Apa syarat kemitraan untuk petani dan distributor?",
    answer:
      "Lengkapi biodata, isi detail lahan atau kebutuhan tonase bulanan, lalu lakukan review. Tim kami akan verifikasi dan menghubungi Anda untuk tahap aktivasi mitra.",
  },
];

const contactCards = [
  {
    label: "WhatsApp",
    value: "+62 812-3456-7890",
    href: "https://wa.me/6281234567890",
    icon: MessageCircle,
    description: "Respon cepat untuk partnership dan order",
  },
  {
    label: "Email",
    value: "halo@infotani.id",
    href: "mailto:halo@infotani.id",
    icon: Mail,
    description: "Dokumen resmi dan pertanyaan kerja sama",
  },
  {
    label: "Google Maps",
    value: "Bandar Lampung, Lampung",
    href: "https://www.google.com/maps?q=Bandar+Lampung",
    icon: MapPin,
    description: "Lokasi kantor operasional kami",
  },
];

const socialLinks = [
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.6 5.82A4.77 4.77 0 0 1 13.7 3h-2.44v12.1a2.23 2.23 0 1 1-1.54-2.12V10.5a4.64 4.64 0 1 0 4 4.6V9.24a7.2 7.2 0 0 0 4.2 1.35V8.17a4.76 4.76 0 0 1-1.31-.2Z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="m20.67 3.26-17.1 6.6c-1.17.47-1.16 1.12-.2 1.42l4.39 1.37 1.69 5.27c.2.56.1.79.7.79.46 0 .66-.2.92-.43.16-.16 1.08-1.05 2.07-2.01l4.3 3.18c.8.44 1.37.21 1.57-.73l2.91-13.72c.29-1.16-.44-1.68-1.25-1.31Zm-11.8 9.08 9.58-6.04c.48-.29.92-.13.56.2l-7.87 7.1-.3 3.07-1.97-4.33Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.5 7.2a3 3 0 0 0-2.12-2.12C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.38.58A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8ZM9.6 15.06V8.94L15.98 12 9.6 15.06Z" />
      </svg>
    ),
  },

];

const initialForm: FormState = {
  name: "",
  phone: "",
  role: "Petani",
  landArea: "",
  location: "",
  monthlyNeeds: "",
  commodity: "",
  notes: "",
};

const motionStep = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.25 } },
};

function ContactCard({
  href,
  label,
  value,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  description: string;
  icon: typeof MessageCircle;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
    >
      <div className="rounded-2xl bg-linear-to-r from-green-500 to-cyan-500 p-3 text-white shadow-md shadow-cyan-500/25 transition group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-600">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </a>
  );
}

export default function HubungiKamiPage() {
  const [step, setStep] = useState<StepId>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const isFarmer = form.role === "Petani";
  const isDistributor = form.role === "Distributor";

  const canContinueStep1 =
    form.name.trim().length > 0 && form.phone.trim().length > 0 && form.role;

  const canContinueStep2 = isFarmer
    ? form.landArea.trim().length > 0 && form.location.trim().length > 0
    : form.monthlyNeeds.trim().length > 0 && form.commodity.trim().length > 0;

  const reviewSummary = useMemo(() => {
    const items = [
      { label: "Nama", value: form.name || "-" },
      { label: "Nomor Telepon", value: form.phone || "-" },
      { label: "Role", value: form.role || "-" },
    ];

    if (isFarmer) {
      items.push(
        { label: "Luas Lahan", value: form.landArea || "-" },
        { label: "Lokasi", value: form.location || "-" },
      );
    }

    if (isDistributor) {
      items.push(
        { label: "Kebutuhan Bulanan", value: form.monthlyNeeds || "-" },
        { label: "Komoditas", value: form.commodity || "-" },
      );
    }

    if (form.notes.trim()) {
      items.push({ label: "Catatan", value: form.notes });
    }

    return items;
  }, [form, isFarmer, isDistributor]);

  function nextStep() {
    setStep((current) => Math.min(3, current + 1) as StepId);
  }

  function prevStep() {
    setStep((current) => Math.max(1, current - 1) as StepId);
  }

  function handleSubmit() {
    setSubmitState({
      status: "loading",
      message: "Mengirim pendaftaran...",
    });

    window.setTimeout(() => {
      setSubmitState({
        status: "success",
        message:
          "Pendaftaran Berhasil Terkirim! Tim InfoTani akan menghubungi Anda segera.",
      });
    }, 900);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#00FFFF_0%,#B0E0E6_100%)] bg-fixed px-4 pb-16 pt-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                <ShieldCheck className="h-4 w-4" />
                Partnership & Contact
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Siap Membangun Ekosistem Pangan Bersama?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Hubungi tim kami atau daftar langsung menjadi mitra resmi di
                bawah ini.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-100 bg-cyan-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Progress
              </p>
              <div className="mt-3 flex items-center gap-2">
                {steps.map((item) => (
                  <div
                    key={item.id}
                    className={`h-2 w-14 rounded-full ${item.id <= step ? "bg-linear-to-r from-green-500 to-cyan-500" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Step {step} of 3 • {steps[step - 1].title}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (step < 3) {
                  if (step === 1 && canContinueStep1) {
                    nextStep();
                  }
                  if (step === 2 && canContinueStep2) {
                    nextStep();
                  }
                  return;
                }

                void handleSubmit();
              }}
            >
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {steps.map((item) => {
                  const active = item.id === step;
                  const complete = item.id < step;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 ${
                        active
                          ? "border-cyan-300 bg-cyan-50"
                          : complete
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Step {item.id}
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-slate-900">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={motionStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <label className="md:col-span-2 block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Nama Lengkap
                      </span>
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nama kontak utama"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Nomor Telepon
                      </span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Role
                      </span>
                      <select
                        value={form.role}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            role: event.target.value as Role,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition focus:ring"
                      >
                        <option value="Petani">Petani</option>
                        <option value="Distributor">Distributor</option>
                      </select>
                    </label>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={motionStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid gap-4 md:grid-cols-2"
                  >
                    {isFarmer ? (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Luas Lahan
                          </span>
                          <input
                            value={form.landArea}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                landArea: event.target.value,
                              }))
                            }
                            placeholder="Contoh: 2 hektare"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Lokasi Lahan
                          </span>
                          <input
                            value={form.location}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                location: event.target.value,
                              }))
                            }
                            placeholder="Metro / Pringsewu / Bandar Lampung"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                          />
                        </label>

                        <label className="md:col-span-2 block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Komoditas
                          </span>
                          <input
                            value={form.commodity}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                commodity: event.target.value,
                              }))
                            }
                            placeholder="Sayuran, buah, padi, cabai, dll."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Komoditas yang Dibutuhkan
                          </span>
                          <input
                            value={form.commodity}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                commodity: event.target.value,
                              }))
                            }
                            placeholder="Contoh: Cabai merah, tomat, kentang"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Estimasi Tonase/Bulan
                          </span>
                          <input
                            value={form.monthlyNeeds}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                monthlyNeeds: event.target.value,
                              }))
                            }
                            placeholder="Contoh: 20 ton per bulan"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                          />
                        </label>
                      </>
                    )}

                    <label className="md:col-span-2 block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Catatan Tambahan
                      </span>
                      <textarea
                        value={form.notes}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Tuliskan detail tambahan, jadwal kerja sama, atau kebutuhan logistik"
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-cyan-200 transition placeholder:text-slate-400 focus:ring"
                      />
                    </label>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={motionStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {reviewSummary.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {submitState.status === "success" ? (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6" />
                          <div>
                            <p className="font-semibold">
                              Pendaftaran terkirim
                            </p>
                            <p className="text-sm text-emerald-700">
                              {submitState.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 text-slate-700">
                        <p className="font-semibold text-slate-900">
                          Siap dikirim
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">
                          Periksa kembali informasi Anda. Setelah klik Daftar,
                          sistem akan menampilkan konfirmasi sukses secara
                          langsung di halaman ini.
                        </p>
                        {submitState.status === "loading" && (
                          <p className="mt-3 text-sm font-medium text-cyan-700">
                            {submitState.message}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Kembali
                </button>

                <div className="flex items-center gap-3">
                  {step < 3 ? (
                    <button
                      type="submit"
                      className="inline-flex animate-pulse items-center gap-2 rounded-full bg-linear-to-r from-green-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.01]"
                    >
                      Lanjut
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitState.status === "loading"}
                      className="inline-flex animate-pulse items-center gap-2 rounded-full bg-linear-to-r from-green-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitState.status === "loading"
                        ? "Mengirim..."
                        : "Daftar"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Kontak Cepat
              </h2>
              <div className="mt-5 grid gap-4">
                {contactCards.map((card) => (
                  <ContactCard key={card.label} {...card} />
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Sprout className="h-4 w-4 text-cyan-700" />
                  <p className="font-semibold">Bandar Lampung Office</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Jl. Distribusi Tani No. 17, Bandar Lampung, Lampung.
                  Koordinasi partnership dan validasi dokumen dilakukan di sini.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    FAQ
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    Pertanyaan Umum
                  </h2>
                </div>
                <Sprout className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="mt-4 space-y-3">
                {faqs.map((item, index) => {
                  const open = openFaq === index;
                  return (
                    <div
                      key={item.question}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            key="faq-answer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="px-4 pb-4 text-sm leading-relaxed text-slate-600"
                          >
                            {item.answer}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Social
              </p>
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="rounded-full bg-white p-2 text-slate-600 shadow transition duration-300 hover:-translate-y-0.5 hover:text-cyan-600 hover:shadow-[0_0_18px_rgba(34,211,238,0.65)]"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
