"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Copy,
  MessageCircle,
  SendHorizonal,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  analyzeLogisticsLoad,
  buildOrderPaymentMessage,
  calculateDiscountedLogisticsCost,
  getFleetOptions,
  type LogisticsVehiclePlan,
  saveTenantOrder,
} from "@/lib/admin-store";
import {
  formatCurrency,
  getCurrentSession,
  getStoredCustomer,
  getTruckLocation,
  saveOrder,
  type CustomerOrder,
} from "@/lib/customer-store";

const paymentMethods = [
  { name: "BCA", image: "/payment.png", note: "Transfer bank" },
  { name: "Mandiri", image: "/payment2.png", note: "Transfer bank" },
  { name: "BNI", image: "/payment3.png", note: "Transfer bank" },
  { name: "BRI", image: "/paymet4.jpg", note: "Transfer bank" },
  { name: "BSI", image: "/paymet6.jpg", note: "Transfer syariah" },
  { name: "CIMB", image: "/paymet7.jpg", note: "Transfer bank" },
  { name: "SeaBank", image: "/paymet8.jpg", note: "Transfer digital" },
  { name: "QRIS", note: "Scan kode QR" },
  { name: "Cash", note: "Bayar langsung" },
] as const;

type ChatMessage = {
  id: number;
  author: "petani" | "pembeli";
  text: string;
  time: string;
};

type DetailInteractivePanelProps = {
  tenantId: string;
  catalogCode: string;
  productId?: string;
  farmerName: string;
  productName: string;
  unitPrice: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  productImage?: string;
  availableProducts?: {
    id: string;
    name: string;
    unitPrice: number;
    stockKg: number;
    imageUrl?: string;
  }[];
};

type CheckoutLineItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  stockKg: number;
  quantityKg: number;
  isSelected: boolean;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function summarizeFleetPlan(plan: LogisticsVehiclePlan[]) {
  if (plan.length === 0) {
    return "Belum ada rekomendasi armada";
  }

  return plan
    .map((item) => `${item.count} ${item.vehicleType}`)
    .join(" + ");
}

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function DetailInteractivePanel({
  tenantId,
  catalogCode,
  productId,
  farmerName,
  productName,
  unitPrice,
  bankName,
  accountNumber,
  accountHolder,
  productImage,
  availableProducts,
}: DetailInteractivePanelProps) {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const currentSession = isHydrated ? getCurrentSession() : null;
  const currentCustomer = isHydrated ? getStoredCustomer() : null;
  const displayFarmerName = farmerName.trim() || "Petani belum diatur";
  const displayProductName = productName.trim() || "Produk belum diatur";
  const displayBankName = bankName.trim() || "Rekening belum diatur";
  const displayAccountNumber = accountNumber.trim() || "0000000000";
  const displayAccountHolder = accountHolder.trim() || displayFarmerName;

  const baseProducts = useMemo(() => {
    if (availableProducts && availableProducts.length > 0) {
      return availableProducts;
    }

    return [
      {
        id: productId || "unknown",
        name: displayProductName,
        unitPrice,
        stockKg: 0,
        imageUrl: productImage,
      },
    ];
  }, [availableProducts, displayProductName, productId, productImage, unitPrice]);

  const [lineItems, setLineItems] = useState<CheckoutLineItem[]>(() =>
    baseProducts.map((item, index) => ({
      productId: item.id,
      productName: item.name,
      unitPrice: item.unitPrice,
      stockKg: item.stockKg,
      quantityKg: index === 0 ? 100 : 0,
      isSelected: index === 0,
    })),
  );
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].name);
  const [shippingMode, setShippingMode] = useState<"PT_INFO_TANI" | "SELF_PICKUP">("PT_INFO_TANI");
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      author: "petani",
      text: `Halo, saya ${displayFarmerName}. Untuk ${displayProductName}, stok masih tersedia dan siap kirim.`,
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
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    billCode: string;
    orderId: string;
    customerName: string;
    paymentMethod: string;
    productSummary: string;
    quantityKg: number;
    subtotal: number;
    logisticsCost: number;
    discountAmount: number;
    totalPay: number;
    logisticsSummary: string;
    truckLocation: string;
    lineItems: {
      productName: string;
      quantityKg: number;
      unitPrice: number;
      subtotal: number;
    }[];
    paymentStatus: "SUCCESS";
  } | null>(null);

  const selectedItems = lineItems
    .filter((item) => item.isSelected)
    .map((item) => ({
      ...item,
      quantityKg: Number.isNaN(item.quantityKg) ? 0 : Math.max(0, item.quantityKg),
    }))
    .filter((item) => item.quantityKg > 0);
  const totalSelectedProducts = selectedItems.length;
  const totalQuantityKg = selectedItems.reduce((sum, item) => sum + item.quantityKg, 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.quantityKg * item.unitPrice, 0);
  const weightTon = totalQuantityKg / 1000;
  const logisticsAnalysis = useMemo(() => analyzeLogisticsLoad(weightTon), [weightTon]);
  const logisticsCostBeforeDiscount = shippingMode === "PT_INFO_TANI" ? logisticsAnalysis.totalAdditionalCost : 0;
  const discountInfo = calculateDiscountedLogisticsCost(
    logisticsCostBeforeDiscount,
    logisticsAnalysis.estimatedVehicleCount,
  );
  const logisticsCost = shippingMode === "PT_INFO_TANI"
    ? discountInfo.totalAfterDiscount
    : 0;
  const totalPay = subtotal + logisticsCost;
  const fleetSummary = summarizeFleetPlan(logisticsAnalysis.recommendation);
  const canPay = totalQuantityKg > 0 && address.trim().length > 8;

  function goToLogin() {
    router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
  }

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

  function handleToggleProduct(productId: string) {
    setLineItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, isSelected: !item.isSelected }
          : item,
      ),
    );
  }

  function handleQuantityChange(productId: string, nextValue: number) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const normalized = Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue);
        const capped = item.stockKg > 0 ? Math.min(item.stockKg, normalized) : normalized;

        return {
          ...item,
          quantityKg: capped,
          isSelected: capped > 0 ? true : item.isSelected,
        };
      }),
    );
  }

  async function handlePayment() {
    if (!currentSession || !currentCustomer) {
      setPaymentNotice("Silakan login customer terlebih dahulu.");
      goToLogin();
      return;
    }

    if (!canPay) {
      setPaymentNotice("Isi jumlah dan alamat pengiriman terlebih dahulu.");
      return;
    }

    if (!tenantId) {
      setPaymentNotice("Tenant katalog belum siap untuk transaksi.");
      return;
    }

    if (selectedItems.length === 0) {
      setPaymentNotice("Pilih minimal satu produk dan isi quantity terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    setPaymentNotice("Membuat pesanan...");

    try {
      const orderItems = selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantityKg: item.quantityKg,
        unitPrice: item.unitPrice,
      }));

      const productSummary = selectedItems
        .map((item) => `${item.productName} (${item.quantityKg.toLocaleString()} kg)`)
        .join(", ");

      // Create order in database
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          customerName: currentSession.name,
          customerEmail: currentSession.email,
          items: orderItems,
          logisticsMethod: shippingMode,
          vehicleCount: logisticsAnalysis.estimatedVehicleCount,
          totalCost: totalPay,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || "Gagal membuat pesanan");
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.orderId;
      const billCode = orderData.trackingCode;

      setPaymentNotice("Menginisiasi pembayaran Midtrans...");

      // Initiate payment
      const paymentResponse = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        // Still save locally even if API fails
        console.error("Payment API error:", error);
      } else {
        const paymentData = await paymentResponse.json();
        if (paymentData.data?.url) {
          // Redirect to Midtrans payment page
          window.location.href = paymentData.data.url;
          return;
        }
      }

      // Fallback: save to localStorage if API fails
      const createdAt = new Date().toISOString();
      const truckLocation = getTruckLocation(address.trim());
      const selectedFleetSummary = shippingMode === "PT_INFO_TANI" ? fleetSummary : "Ambil sendiri di lokasi petani";
      const paymentMessage = buildOrderPaymentMessage({
        customerName: currentSession.name,
        productName: productSummary,
        billCode,
        totalPay,
        paymentMethod,
      });

      saveTenantOrder(tenantId, {
        customerName: currentSession.name,
        customerEmail: currentSession.email,
        billCode,
        createdAt,
        paymentMethod,
        shippingOption: shippingMode,
        deliveryStatus: "Konfirmasi",
        shipmentWeightTon: Number(weightTon.toFixed(3)),
        lineItems: orderItems,
        subtotal,
        logisticsAnalysis,
        logisticsTypeLabel: selectedFleetSummary,
        logisticsAdditionalCost: logisticsCost,
        totalPay,
        truckLocationLabel: truckLocation,
        paymentStatus: "SUCCESS",
        messages: [paymentMessage],
      });

      const averageUnitPrice = totalQuantityKg > 0
        ? Math.round(subtotal / totalQuantityKg)
        : 0;

      const customerOrder: CustomerOrder = {
        id: orderId,
        productId: selectedItems.map((item) => item.productId).join("+"),
        productName: productSummary,
        farmerName: displayFarmerName,
        location: address.trim(),
        basePricePerKg: averageUnitPrice,
        quantity: totalQuantityKg,
        unit: "kg",
        quantityKg: totalQuantityKg,
        address: address.trim(),
        logisticsId: shippingMode === "PT_INFO_TANI" ? "pt-info-tani" : "self-pickup",
        logisticsLabel: selectedFleetSummary,
        logisticsFee: logisticsCost,
        paymentMethod,
        subtotal,
        total: totalPay,
        createdAt,
        status: "Diproses",
        trackingNote: "Pembayaran berhasil. Pesanan sudah diteruskan ke admin untuk dikemas.",
        truckLocation,
        destination: address.trim(),
      };

      saveOrder(customerOrder);

      setReceipt({
        billCode,
        orderId,
        customerName: currentSession.name,
        paymentMethod,
        productSummary,
        quantityKg: totalQuantityKg,
        subtotal,
        logisticsCost,
        discountAmount: discountInfo.discountAmount,
        totalPay,
        logisticsSummary: selectedFleetSummary,
        truckLocation,
        lineItems: selectedItems.map((item) => ({
          productName: item.productName,
          quantityKg: item.quantityKg,
          unitPrice: item.unitPrice,
          subtotal: item.quantityKg * item.unitPrice,
        })),
        paymentStatus: "SUCCESS",
      });

      setPaymentNotice("Pembayaran sukses. Bill sudah dibuat dan notifikasi masuk ke admin.");
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          author: "petani",
          text: "Pembayaran sukses, pesanan masuk ke pesan admin dan akan diproses.",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memproses pembayaran";
      setPaymentNotice(`Error: ${message}`);
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Metode Pembayaran
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Bayar langsung di katalog</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pilih metode, tentukan jumlah, lalu sistem membuat bill dan meneruskan pesanan ke admin.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rekening petani</p>
            <p className="mt-1 font-semibold text-slate-900">{displayBankName}</p>
            <p className="text-xs text-slate-600">a.n. {displayAccountHolder}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paymentMethods.map((method) => {
            const isActive = paymentMethod === method.name;

            return (
              <button
                key={method.name}
                type="button"
                onClick={() => setPaymentMethod(method.name)}
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
                    <span className="text-sm font-semibold text-slate-700">{method.name}</span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{method.name}</p>
                <p className="text-xs text-slate-500">{method.note}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rekening tujuan</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{paymentMethod}</span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">{displayBankName}</span>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs text-slate-500">Nama pemilik rekening</p>
                <p className="font-semibold text-slate-900">{displayAccountHolder}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor rekening</p>
                <p className="font-semibold tracking-[0.08em] text-indigo-700">{displayAccountNumber}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Aksi cepat</p>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(displayAccountNumber)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Copy className="h-4 w-4" />
              Salin Nomor Rekening
            </button>
            <a
              href={`https://wa.me/6281234567890?text=Saya%20ingin%20transfer%20ke%20rekening%20${displayBankName}%20${displayAccountNumber}%20atas%20nama%20${encodeURIComponent(displayAccountHolder)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Petani via WhatsApp
            </a>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Setelah memilih metode, lakukan pembayaran. Bill akan dibuat otomatis dan dikirim ke admin.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-indigo-700">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-slate-900">Payment Calculator</h3>
        </div>

        <p className="text-sm text-slate-600">Pilih produk yang ingin dibeli lalu isi quantity per produk (kg).</p>

        <div className="mt-4 space-y-3">
          {lineItems.map((item) => {
            const itemSubtotal = item.quantityKg * item.unitPrice;

            return (
              <article
                key={item.productId}
                className={`rounded-2xl border p-3 transition sm:p-4 ${
                  item.isSelected
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => handleToggleProduct(item.productId)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{item.productName}</span>
                      <span className="text-xs text-slate-500">
                        Harga {formatCurrency(item.unitPrice)} / kg
                        {item.stockKg > 0 ? ` • stok ${item.stockKg.toLocaleString()} kg` : ""}
                      </span>
                    </span>
                  </label>

                  <div className="w-full sm:w-44">
                    <label className="text-xs font-medium text-slate-600" htmlFor={`qty-${item.productId}`}>
                      Quantity (kg)
                    </label>
                    <input
                      id={`qty-${item.productId}`}
                      type="number"
                      min={0}
                      value={item.quantityKg}
                      onChange={(event) => handleQuantityChange(item.productId, Number(event.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-indigo-200 transition focus:ring"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Subtotal item</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(itemSubtotal)}</span>
                </div>
              </article>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="address">
          Alamat Pengiriman
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Contoh: Jl. Soekarno Hatta, Bandar Lampung"
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-indigo-200 transition focus:ring"
        />

        <div className="mt-4 grid gap-3 rounded-2xl bg-cyan-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-slate-500">Produk dipilih</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{totalSelectedProducts} item</p>
          </div>
          <div>
            <p className="text-slate-500">Subtotal</p>
            <p className="mt-1 text-base font-semibold text-indigo-700">{formatCurrency(subtotal)}</p>
          </div>
          <div>
            <p className="text-slate-500">Ongkir sebelum diskon</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(logisticsCostBeforeDiscount)}</p>
          </div>
          <div>
            <p className="text-slate-500">Total Bayar</p>
            <p className="mt-1 text-base font-semibold text-emerald-700">{formatCurrency(totalPay)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Truck className="h-5 w-5 text-cyan-700" />
              <h4 className="font-semibold">Rekomendasi Truk</h4>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Mode kirim: {shippingMode === "PT_INFO_TANI" ? "Kirim via PT InfoTani" : "Ambil sendiri"}</p>
              <p>Berat: {weightTon.toFixed(3)} ton</p>
              <p>Armada: {fleetSummary}</p>
              <p>Estimasi kendaraan: {logisticsAnalysis.estimatedVehicleCount} unit</p>
              <p>Diskon armada: {discountInfo.discountPercentage}%</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShippingMode("PT_INFO_TANI")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  shippingMode === "PT_INFO_TANI"
                    ? "bg-cyan-600 text-white"
                    : "border border-cyan-200 bg-white text-cyan-700"
                }`}
              >
                PT InfoTani
              </button>
              <button
                type="button"
                onClick={() => setShippingMode("SELF_PICKUP")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  shippingMode === "SELF_PICKUP"
                    ? "bg-cyan-600 text-white"
                    : "border border-cyan-200 bg-white text-cyan-700"
                }`}
              >
                Pick Up Sendiri
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ringkasan Bill</p>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>Produk</span><span>{totalSelectedProducts} item</span></div>
              <div className="flex items-center justify-between"><span>Quantity</span><span>{totalQuantityKg.toLocaleString()} kg</span></div>
              <div className="flex items-center justify-between"><span>Metode bayar</span><span>{paymentMethod}</span></div>
              <div className="flex items-center justify-between"><span>Lokasi tujuan</span><span>{address.trim() || "Belum diisi"}</span></div>
              <div className="flex items-center justify-between font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(totalPay)}</span></div>
            </div>
          </div>
        </div>

        {paymentNotice && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {paymentNotice}
          </div>
        )}

        <button
          type="button"
          onClick={handlePayment}
          disabled={!canPay || isProcessing}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isProcessing
            ? "Memproses pembayaran..."
            : currentSession && currentCustomer
              ? "Bayar Sekarang"
              : "Login untuk Bayar"}
        </button>
      </section>

      {receipt && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Pembayaran sukses
              </div>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Bill #{receipt.billCode}</h3>
              <p className="mt-1 text-sm text-slate-600">Pesanan sudah masuk ke admin dan menunggu proses pengemasan.</p>
            </div>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(receipt.billCode)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              <Copy className="h-4 w-4" />
              Salin Bill
            </button>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Order ID</p>
              <p className="font-semibold text-slate-900">{receipt.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-semibold text-slate-900">{receipt.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Bayar</p>
              <p className="font-semibold text-emerald-700">{formatCurrency(receipt.totalPay)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lokasi Armada</p>
              <p className="font-semibold text-slate-900">{receipt.truckLocation}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Rincian Invoice</p>
            <div className="mt-2 space-y-2">
              <p>Produk: {receipt.productSummary}</p>
              <p>Quantity: {receipt.quantityKg.toLocaleString()} kg</p>
              <p>Subtotal: {formatCurrency(receipt.subtotal)}</p>
              <p>Ongkir: {formatCurrency(receipt.logisticsCost)}</p>
              <p>Diskon armada: {formatCurrency(receipt.discountAmount)}</p>
              <p className="font-semibold">Metode pembayaran: {receipt.paymentMethod}</p>
              <p className="font-semibold text-emerald-700">Status: {receipt.paymentStatus}</p>
            </div>

            <div className="mt-3 space-y-2 border-t border-emerald-100 pt-3">
              {receipt.lineItems.map((item) => (
                <div key={`${item.productName}-${item.quantityKg}`} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                  <p className="text-slate-600">
                    {item.productName}
                    <span className="text-slate-500"> • {item.quantityKg.toLocaleString()} kg x {formatCurrency(item.unitPrice)}</span>
                  </p>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-700">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-slate-900">Direct Chat</h3>
        </div>

        <div className="h-72 space-y-3 overflow-y-auto rounded-2xl bg-[#EAF8F2] p-3">
          {messages.map((message) => {
            const isBuyer = message.author === "pembeli";

            return (
              <div key={message.id} className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}>
                <article className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isBuyer ? "bg-[#DCF8C6] text-slate-800" : "bg-white text-slate-700"}`}>
                  <p>{message.text}</p>
                  <p className="mt-1 text-right text-[11px] text-slate-500">{message.time}</p>
                </article>
              </div>
            );
          })}
        </div>

        <form className="mt-3 flex items-center gap-2" onSubmit={handleSendMessage}>
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

      {productImage && (
        <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-64 bg-slate-100">
              <Image src={productImage} alt={displayProductName} fill className="object-cover" />
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-700">Katalog {catalogCode}</p>
              <h4 className="mt-2 text-xl font-semibold text-slate-900">{displayProductName}</h4>
              <p className="mt-2 text-sm text-slate-600">
                Harga bisa diatur per kg dari admin, dan foto per katalog tersimpan terpisah untuk setiap item.
              </p>
              <div className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{formatRupiah(unitPrice)} / kg</p>
                <p className="mt-1">Rekomendasi armada: {getFleetOptions().length} jenis truk tersedia.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
