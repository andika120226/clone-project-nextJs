"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import {
  Calculator,
  Copy,
  MessageCircle,
  SendHorizonal,
  ShieldCheck,
} from "lucide-react";

type ChatMessage = {
  id: number;
  author: "petani" | "pembeli";
  text: string;
  time: string;
};

type DetailInteractivePanelProps = {
  farmerName: string;
  productName: string;
  unitPrice: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

type PaymentMethod = {
  name: string;
  image?: string;
  note: string;
};

const paymentMethods: PaymentMethod[] = [
  { name: "BCA", image: "/payment.png", note: "Transfer bank" },
  { name: "Mandiri", image: "/payment2.png", note: "Transfer bank" },
  { name: "BNI", image: "/payment3.png", note: "Transfer bank" },
  { name: "BRI", image: "/paymet4.jpg", note: "Transfer bank" },
  { name: "BSI", image: "/paymet6.jpg", note: "Transfer syariah" },
  { name: "CIMB", image: "/paymet7.jpg", note: "Transfer bank" },
  { name: "SeaBank", image: "/paymet8.jpg", note: "Transfer digital" },
  { name: "QRIS", note: "Scan kode QR" },
  { name: "Cash", note: "Bayar langsung" },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DetailInteractivePanel({
  farmerName,
  productName,
  unitPrice,
  bankName,
  accountNumber,
  accountHolder,
}: DetailInteractivePanelProps) {
  const [quantity, setQuantity] = useState(100);
  const [draft, setDraft] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethods[0].name,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      author: "petani",
      text: `Halo, saya ${farmerName}. Untuk ${productName}, stok masih tersedia dan siap kirim.`,
      time: "09:10",
    },
    {
      id: 2,
      author: "pembeli",
      text: "Baik pak, apakah bisa kirim ke gudang Metro minggu ini?",
      time: "09:12",
    },
    {
      id: 3,
      author: "petani",
      text: "Bisa, jadwal pengiriman paling cepat hari Kamis.",
      time: "09:14",
    },
  ]);

  const totalPrice = useMemo(() => {
    const safeQuantity = Number.isNaN(quantity) ? 0 : Math.max(0, quantity);
    return safeQuantity * unitPrice;
  }, [quantity, unitPrice]);

  const activePaymentMethod = paymentMethods.find(
    (method) => method.name === selectedPaymentMethod,
  );

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "pembeli",
        text: draft.trim(),
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Payment Methods
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              9 Metode Pembayaran
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Pilih metode yang diinginkan, lalu sistem akan menampilkan
              rekening petani tujuan.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Rekening petani
            </p>
            <p className="mt-1 font-semibold text-slate-900">{bankName}</p>
            <p className="text-xs text-slate-600">a.n. {accountHolder}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paymentMethods.map((method) => {
            const isActive = selectedPaymentMethod === method.name;

            return (
              <button
                key={method.name}
                type="button"
                onClick={() => setSelectedPaymentMethod(method.name)}
                className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50"
                }`}
              >
                <div className="flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                  {method.image ? (
                    <Image
                      src={method.image}
                      alt={method.name}
                      width={140}
                      height={48}
                      className="h-10 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-700">
                      {method.name}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {method.name}
                </p>
                <p className="text-xs text-slate-500">{method.note}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Rekening tujuan
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">
                {activePaymentMethod?.name ?? selectedPaymentMethod}
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {bankName}
              </span>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs text-slate-500">Nama pemilik rekening</p>
                <p className="font-semibold text-slate-900">{accountHolder}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor rekening</p>
                <p className="font-semibold tracking-[0.08em] text-indigo-700">
                  {accountNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Aksi cepat
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(accountNumber)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Copy className="h-4 w-4" />
              Salin Nomor Rekening
            </button>
            <a
              href={`https://wa.me/6281234567890?text=Saya%20ingin%20transfer%20ke%20rekening%20${bankName}%20${accountNumber}%20atas%20nama%20${encodeURIComponent(accountHolder)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Petani via WhatsApp
            </a>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Setelah memilih metode, lakukan transfer ke rekening di atas lalu
              konfirmasi melalui chat.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-indigo-700">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-slate-900">
            Payment Calculator
          </h3>
        </div>

        <p className="text-sm text-slate-600">
          Isi quantity pembelian (kg) untuk menghitung total harga otomatis.
        </p>

        <label
          className="mt-4 block text-sm font-medium text-slate-700"
          htmlFor="quantity"
        >
          Quantity (kg)
        </label>
        <input
          id="quantity"
          type="number"
          min={0}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-indigo-200 transition focus:ring"
        />

        <div className="mt-4 grid gap-3 rounded-2xl bg-cyan-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Harga / kg</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {formatRupiah(unitPrice)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Total Price</p>
            <p className="mt-1 text-base font-semibold text-indigo-700">
              {formatRupiah(totalPrice)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-700">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-slate-900">Direct Chat</h3>
        </div>

        <div className="h-72 space-y-3 overflow-y-auto rounded-2xl bg-[#EAF8F2] p-3">
          {messages.map((message) => {
            const isBuyer = message.author === "pembeli";

            return (
              <div
                key={message.id}
                className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}
              >
                <article
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isBuyer
                      ? "bg-[#DCF8C6] text-slate-800"
                      : "bg-white text-slate-700"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="mt-1 text-right text-[11px] text-slate-500">
                    {message.time}
                  </p>
                </article>
              </div>
            );
          })}
        </div>

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={handleSendMessage}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ketik pesan..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-indigo-200 focus:ring"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-white transition hover:bg-indigo-500"
            aria-label="Kirim pesan"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
