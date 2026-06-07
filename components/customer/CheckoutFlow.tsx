"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { DATA_TANI } from "@/lib/data-dummy";
import {
  formatCurrency,
  getCurrentSession,
  getPrimaryTruckLabel,
  getStoredCustomer,
  getStoredToken,
  getTruckLocation,
  logisticsOptions,
  saveOrder,
  type CheckoutUnit,
  type CustomerOrder,
} from "@/lib/customer-store";

interface CustomerAddress {
  id: string;
  fullAddress: string;
  isMain: boolean;
  phoneNumber?: string;
  label?: string;
}

type Step = 1 | 2 | 3;

type PaymentGatewayCard = {
  code: string;
  title: string;
  description: string;
  image: string;
  method: "BANK_TRANSFER" | "QRIS" | "E_WALLET";
};

const paymentGatewayCards: PaymentGatewayCard[] = [
  {
    code: "payment1",
    title: "Transfer Bank",
    description: "Pembayaran via bank transfer.",
    image: "/payment1.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment2",
    title: "Transfer Bank 1",
    description: "Metode transfer bank tambahan.",
    image: "/payment2.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment3",
    title: "Transfer Bank 2",
    description: "Pembayaran cepat dengan QR.",
    image: "/payment3.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment4",
    title: "QRIS 2",
    description: "Pilihan QR alternatif.",
    image: "/payment4.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment5",
    title: "E-Wallet 1",
    description: "Pembayaran digital otomatis.",
    image: "/payment5.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment6",
    title: "E-Wallet 2",
    description: "Pilihan dompet digital alternatif.",
    image: "/payment6.webp",
    method: "BANK_TRANSFER",
  },
  {
    code: "payment7",
    title: "E-Wallet 3",
    description: "Gateway pembayaran digital tambahan.",
    image: "/payment7.webp",
    method: "BANK_TRANSFER",
  },
];

const paymentMethodLabels: Record<PaymentGatewayCard["method"], string> = {
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  E_WALLET: "E-Wallet",
};

const stepMotion = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

function getBasePrice(productName: string) {
  if (productName.toLowerCase().includes("kopi")) {
    return 62000;
  }

  if (productName.toLowerCase().includes("cabai")) {
    return 36000;
  }

  if (productName.toLowerCase().includes("padi")) {
    return 13000;
  }

  if (productName.toLowerCase().includes("jagung")) {
    return 9800;
  }

  return 15000;
}

function getUnitMultiplier(unit: CheckoutUnit) {
  return unit === "gram" ? 0.001 : 1;
}

export default function CheckoutFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") ?? DATA_TANI[0]?.id ?? "";
  const product = DATA_TANI.find((item) => item.id === productId) ?? DATA_TANI[0];
  const session = getCurrentSession();
  const account = getStoredCustomer();
  const customerToken = session?.token || getStoredToken();

  const [step, setStep] = useState<Step>(1);
  const [address, setAddress] = useState("");
  const [dbAddresses, setDbAddresses] = useState<CustomerAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [unit, setUnit] = useState<CheckoutUnit>("kg");
  const [quantity, setQuantity] = useState(1);
  const [logisticsId, setLogisticsId] = useState(logisticsOptions[0].id);
  const [selectedPaymentCardCode, setSelectedPaymentCardCode] = useState(paymentGatewayCards[0].code);
  const [successOrder, setSuccessOrder] = useState<CustomerOrder | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customerToken) return;

    void (async () => {
      try {
        // Fetch addresses
        const addrRes = await fetch("/api/profile/addresses", {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (addrRes.ok) {
          const payload = await addrRes.json();
          if (Array.isArray(payload.data)) {
            setDbAddresses(payload.data);
            const main = payload.data.find((a: CustomerAddress) => a.isMain) || payload.data[0];
            if (main) {
              setAddress(main.fullAddress);
              setAddressId(main.id);
            }
          }
        }

        // Fetch banks
        const bankRes = await fetch("/api/profile/banks", {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (bankRes.ok) {
          const payload = await bankRes.json();
          if (Array.isArray(payload.data)) {
            if (payload.data.length > 0) {
              setBankAccountId(payload.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Gagal memuat profil database di checkout:", err);
      }
    })();
  }, [customerToken]);

  const selectedPaymentCard = paymentGatewayCards.find((card) => card.code === selectedPaymentCardCode) ?? paymentGatewayCards[0];
  const paymentMethod = selectedPaymentCard.method;

  const selectedLogistics =
    logisticsOptions.find((option) => option.id === logisticsId) ??
    logisticsOptions[0];

  const quantityKg = useMemo(
    () => Math.max(0, Number(quantity)) * getUnitMultiplier(unit),
    [quantity, unit],
  );

  const basePrice = getBasePrice(product.nama_produk);
  const subtotal = Math.round(quantityKg * basePrice);
  const logisticsFee = selectedLogistics.rentalFee;
  const total = subtotal + logisticsFee;

  const canProceed =
    address.trim().length > 8 &&
    quantityKg > 0 &&
    quantityKg <= selectedLogistics.capacityKg &&
    quantityKg <= product.stok;

  function goToAuth(path: "login" | "signup") {
    router.push(
      `/auth/${path}?next=${encodeURIComponent(`/checkout?productId=${product.id}`)}`,
    );
  }

  async function handlePay() {
    if (!session || !account) {
      setValidationMessage("Silakan login customer terlebih dahulu.");
      return;
    }

    if (!customerToken) {
      setValidationMessage("Token customer tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!canProceed) {
      setValidationMessage("Periksa alamat, jumlah, dan kapasitas angkutan.");
      return;
    }

    try {
      let finalAddressId = addressId;
      const matchedAddress = dbAddresses.find(
        (a) => a.fullAddress.trim().toLowerCase() === address.trim().toLowerCase()
      );

      if (matchedAddress) {
        finalAddressId = matchedAddress.id;
      } else {
        setValidationMessage("Menyimpan alamat pengiriman baru ke database...");
        try {
          const addrRes = await fetch("/api/profile/addresses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${customerToken}`,
            },
            body: JSON.stringify({
              label: "Alamat Pengiriman Baru",
              recipientName: account.name || "Customer InfoTani",
              phoneNumber: account.phone || "08xxxxxxxxxx",
              fullAddress: address.trim(),
              city: "Bandar Lampung",
              province: "Lampung",
              isMain: dbAddresses.length === 0,
            }),
          });
          if (addrRes.ok) {
            const payload = await addrRes.json();
            finalAddressId = payload.data?.id;
          }
        } catch (e) {
          console.error("Gagal menyimpan alamat baru ke database:", e);
        }
      }

      setValidationMessage("Membuat pesanan...");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              quantityKg,
            },
          ],
          addressId: finalAddressId,
          customerBankAccountId: bankAccountId,
          logisticsVehicleId: null,
          logisticsCost: logisticsFee,
          paymentMethod,
          logisticsLabel: selectedLogistics.label,
          notes: `Checkout via ${selectedLogistics.label}`,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menyimpan order ke database.");
      }

      const createdOrderId = payload?.data?.id;
      if (!createdOrderId) {
        throw new Error("Order berhasil dibuat tetapi ID tidak ditemukan.");
      }

      const paymentResponse = await fetch(`/api/orders/${createdOrderId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });

      if (!paymentResponse.ok) {
        const paymentError = await paymentResponse.json().catch(() => null);
        throw new Error(paymentError?.error || "Gagal membuat record pembayaran.");
      }

      const order: CustomerOrder = {
        id: payload?.data?.trackingId ?? createdOrderId,
        productId: product.id,
        productName: product.nama_produk,
        farmerName: product.nama_petani,
        location: product.lokasi,
        basePricePerKg: basePrice,
        quantity,
        unit,
        quantityKg,
        address: address.trim(),
        logisticsId: selectedLogistics.id,
        logisticsLabel: selectedLogistics.label,
        logisticsFee,
        paymentMethod,
        subtotal,
        total,
        createdAt: payload?.data?.createdAt ?? new Date().toISOString(),
        status: "Diproses",
        trackingNote: `Order tersimpan di database. Armada ${selectedLogistics.label} sedang disiapkan.`,
        truckLocation: getTruckLocation(address),
        destination: address.trim(),
      };

      saveOrder(order);
      setSuccessOrder(order);
      setStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memproses checkout.";
      setValidationMessage(message);
    }
  }

  if (!session || !account) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 md:px-8">
        <section className="mx-auto grid w-full max-w-5xl gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
              Checkout Customer
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Login diperlukan sebelum bayar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
              Untuk menyelesaikan transaksi, customer harus memiliki akun dulu.
              Setelah login, kamu bisa lanjut ke alamat, angkutan, metode
              pembayaran, lalu invoice otomatis.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => goToAuth("login")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Login Customer
              </button>
              <button
                type="button"
                onClick={() => goToAuth("signup")}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-semibold text-zinc-100 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Sign-up Customer
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-sm font-semibold text-zinc-200">Produk dipilih</p>
            <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
                {product.nama_petani}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{product.nama_produk}</h2>
              <p className="mt-2 text-sm text-zinc-400">{product.lokasi}</p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Akses customer aktif setelah login
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 md:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/75 p-5 shadow-2xl md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
                Flow Checkout
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
                {product.nama_produk}
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Customer: {session.name} • {session.email}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
              <p className="text-zinc-500">Stok tersedia</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {product.stok.toLocaleString()} kg
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["1. Alamat & Angkutan", "2. Pembayaran", "3. Invoice"].map(
              (label, index) => {
                const active = step === (index + 1) as Step;

                return (
                  <div
                    key={label}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      active
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    {label}
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-6 min-h-107.5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepMotion}
                  className="space-y-5"
                >
                  <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Package className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Berat Produk</h2>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm text-zinc-400">Satuan</span>
                        <select
                          value={unit}
                          onChange={(event) => setUnit(event.target.value as CheckoutUnit)}
                          className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none"
                        >
                          <option value="kg">Kilogram</option>
                          <option value="gram">Gram</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm text-zinc-400">Jumlah</span>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(event) => setQuantity(Number(event.target.value))}
                          className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none"
                        />
                      </label>
                    </div>

                    <div className="mt-4 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-300">
                      {unit === "kg"
                        ? `${quantityKg.toFixed(2)} kg`
                        : `${quantity} gram`}
                      <span className="ml-2 text-zinc-500">
                        dipakai untuk hitung harga otomatis.
                      </span>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm text-zinc-400">Alamat Pengiriman</span>
                      <textarea
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Contoh: Jl. Soekarno Hatta, Bandar Lampung"
                        className="mt-2 min-h-28 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none"
                      />
                    </label>
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Truck className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Logistics Picker</h2>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {logisticsOptions.map((option) => {
                        const active = logisticsId === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setLogisticsId(option.id)}
                            className={`rounded-3xl border p-4 text-left transition ${
                              active
                                ? "border-cyan-400 bg-cyan-500/10"
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            <p className="text-base font-semibold text-zinc-100">
                              {option.label}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {option.description}
                            </p>
                            <p className="mt-3 text-sm text-cyan-300">
                              Kapasitas {option.capacityKg.toLocaleString()} kg
                            </p>
                            <p className="text-sm text-emerald-300">
                              Sewa {formatCurrency(option.rentalFee)}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-300">
                      <p>Armada terpilih: {selectedLogistics.label}</p>
                      <p className="mt-1 text-zinc-500">
                        Muatan maksimal {selectedLogistics.capacityKg.toLocaleString()} kg.
                      </p>
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={() => {
                      if (!canProceed) {
                        setValidationMessage(
                          "Jumlah barang melebihi kapasitas atau stok.",
                        );
                        return;
                      }

                      setValidationMessage(null);
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
                  >
                    Lanjut ke Pembayaran
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepMotion}
                  className="space-y-5"
                >
                  <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Payment</h2>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {paymentGatewayCards.map((card) => {
                        const active = selectedPaymentCardCode === card.code;

                        return (
                          <button
                            key={card.code}
                            type="button"
                            onClick={() => setSelectedPaymentCardCode(card.code)}
                            className={`overflow-hidden rounded-3xl border text-left transition ${
                              active
                                ? "border-emerald-400 bg-emerald-500/10"
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex h-28 items-center justify-center bg-zinc-950 px-4">
                              <Image
                                src={card.image}
                                alt={card.title}
                                width={280}
                                height={96}
                                className="h-16 w-auto object-contain"
                              />
                            </div>
                            <div className="px-4 py-4">
                              <p className="text-base font-semibold text-zinc-100">{card.title}</p>
                              <p className="mt-1 text-sm text-zinc-400">{card.description}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-300">
                                {paymentMethodLabels[card.method]}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <MapPin className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Checkout Ringkas</h2>
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-zinc-300">
                      <p>Alamat: {address}</p>
                      <p>Angkutan: {selectedLogistics.label}</p>
                      <p>Jumlah: {quantityKg.toFixed(2)} kg</p>
                      <p>Metode: {paymentMethodLabels[paymentMethod]}</p>
                    </div>

                    {validationMessage && (
                      <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        {validationMessage}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-2xl border border-zinc-800 px-5 py-3 font-semibold text-zinc-200 transition hover:border-zinc-700"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={handlePay}
                        className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400"
                      >
                        Bayar Sekarang
                      </button>
                    </div>
                  </section>
                </motion.div>
              )}

              {step === 3 && successOrder && (
                <motion.div
                  key="step-3"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepMotion}
                  className="space-y-5"
                >
                  <section className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6">
                    <motion.div
                      animate={{ scale: [0.95, 1.04, 1] }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="flex items-center gap-3"
                    >
                      <div className="rounded-full bg-emerald-500 p-3 text-zinc-950">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                          Bayar Berhasil
                        </p>
                        <h2 className="text-2xl font-semibold text-zinc-100">
                          Transaksi tersimpan
                        </h2>
                      </div>
                    </motion.div>

                    <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                      Invoice sudah disimpan ke profile customer. Armada {successOrder.logisticsLabel} sedang diproses menuju alamat pengiriman.
                    </p>
                  </section>

                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
                  >
                    Buka Profile Customer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </article>

        <aside className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/75 p-5 md:p-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
              Invoice
            </p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">
              Struk Belanja
            </h2>

            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <span>Produk</span>
                <span className="text-right font-medium text-zinc-100">
                  {product.nama_produk}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Harga / kg</span>
                <span className="font-medium text-zinc-100">
                  {formatCurrency(basePrice)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Jumlah</span>
                <span className="font-medium text-zinc-100">
                  {quantityKg.toFixed(2)} kg
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Logistik</span>
                <span className="font-medium text-zinc-100">
                  {selectedLogistics.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Biaya logistik</span>
                <span className="font-medium text-zinc-100">
                  {formatCurrency(logisticsFee)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3 text-base">
                <span className="font-semibold text-zinc-100">Total bayar</span>
                <span className="font-semibold text-emerald-300">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Tracking Maps
            </p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">
              Armada sedang jalan
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {getPrimaryTruckLabel(selectedLogistics.id)} menuju {address || "alamat customer"}.
            </p>

            <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <iframe
                title="Tracking Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  address || product.lokasi,
                )}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          {successOrder && (
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Invoice ID
              </p>
              <p className="mt-2 font-semibold text-zinc-100">{successOrder.id}</p>
              <p className="mt-3">{successOrder.trackingNote}</p>
              <p className="mt-2 text-zinc-500">
                Posisi armada: {successOrder.truckLocation}
              </p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
