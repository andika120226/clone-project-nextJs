"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState, useSyncExternalStore, useEffect } from "react";
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Copy,
  MessageCircle,
  SendHorizonal,
  Truck,
} from "lucide-react";
import {
  analyzeLogisticsLoad,
  calculateDiscountedLogisticsCost,
  type LogisticsVehiclePlan,
} from "@/lib/admin-store";
import {
  clearSession,
  formatCurrency,
  getCurrentSession,
  getStoredCustomer,
  getStoredToken,
  verifyStoredSession,
  getTruckLocation,
  saveCustomer,
  saveSession,
  saveToken,
  type CustomerAccount,
  type AuthSession,
} from "@/lib/customer-store";

interface CustomerAddress {
  id: string;
  fullAddress: string;
  isMain: boolean;
  phoneNumber?: string;
  label?: string;
}

type PaymentMethodName = "BCA" | "PayPal" | "Mandiri" | "BNI" | "BRI" | "T" | "USD Coin" ;

type PaymentMethodOption = {
  name: PaymentMethodName;
  image?: string;
  note: string;
};

const paymentMethods: PaymentMethodOption[] = [
  { name: "BCA", image: "/payment4.webp", note: "Transfer bank" },
  { name: "PayPal", image: "/payment7.webp", note: "Pembayaran online" },
  { name: "Mandiri", image: "/payment5.webp", note: "Pembayaran online" },
  { name: "BNI", image: "/payment6.webp", note: "Transfer bank" },
  { name: "BRI", image: "/payment3.webp", note: "Transfer bank" },
  { name: "USD Coin", image: "/payment1.webp", note: "Transfer bank" },
  { name: "T", image: "/payment2.webp", note: "Transfer bank" },

];

function resolvePaymentMethod(value: string) {
  const input = value.trim().toUpperCase();
  if (input === "BCA" || input === "BNI" || input === "BRI" || input === "MANDIRI") return "BANK_TRANSFER";
  if (input === "QRIS") return "QRIS";
  if (input === "PAYPAL") return "E_WALLET";
  return "BANK_TRANSFER";
}

const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "metro": { lat: -5.1147, lng: 105.3066 },
  "bandar lampung": { lat: -5.3971, lng: 105.2668 },
  "rajabasa": { lat: -5.3853, lng: 105.2443 },
  "kemiling": { lat: -5.4025, lng: 105.2058 },
  "panjang": { lat: -5.4600, lng: 105.3100 },
  "sukarame": { lat: -5.3850, lng: 105.3000 },
  "lampung tengah": { lat: -4.8660, lng: 105.2100 },
  "lampung selatan": { lat: -5.7118, lng: 105.5898 },
  "kalianda": { lat: -5.7500, lng: 105.5900 },
  "lampung timur": { lat: -5.1000, lng: 105.6800 },
  "lampung utara": { lat: -4.8200, lng: 104.8900 },
  "kotabumi": { lat: -4.8300, lng: 104.8800 },
  "pringsewu": { lat: -5.3500, lng: 104.9800 },
  "pesawaran": { lat: -5.4500, lng: 105.1800 },
  "tanggamus": { lat: -5.4700, lng: 104.7000 },
  "jakarta": { lat: -6.2088, lng: 106.8456 },
  "palembang": { lat: -2.9909, lng: 104.7566 },
};

function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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
}

function getCoordsFromAddressText(addressText: string): { lat: number; lng: number } | null {
  const text = addressText.toLowerCase();
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    if (text.includes(key)) {
      return coords;
    }
  }
  return null;
}

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
  farmerLatitude?: number;
  farmerLongitude?: number;
};

type CheckoutLineItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  stockKg: number;
  quantityKg: number;
  isSelected: boolean;
};

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
  farmerName,
  productName,
  bankName,
  accountNumber,
  accountHolder,
  availableProducts,
  farmerLatitude,
  farmerLongitude,
}: DetailInteractivePanelProps) {
  const isHydrated = useIsHydrated();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [authPromptStep, setAuthPromptStep] = useState<"ask" | "form">("ask");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (isHydrated) {
      setSession(getCurrentSession());
      setCustomer(getStoredCustomer());
    }
  }, [isHydrated]);

  const currentSession = session;
  const currentCustomer = customer;
  const displayFarmerName = farmerName.trim() || "Petani belum diatur";
  const displayProductName = productName.trim() || "Produk belum diatur";
  const displayBankName = bankName.trim() || "Rekening belum diatur";
  const displayAccountNumber = accountNumber.trim() || "0000000000";
  const displayAccountHolder = accountHolder.trim() || displayFarmerName;

  const baseProducts = useMemo(() => {
    return (availableProducts ?? []).filter(
      (item) => item.id.trim().length > 0 && item.stockKg > 0,
    );
  }, [availableProducts]);

  const hasCatalogProducts = baseProducts.length > 0;

  const [lineItems, setLineItems] = useState<CheckoutLineItem[]>(() =>
    baseProducts.map((item, index) => ({
      productId: item.id,
      productName: item.name,
      unitPrice: item.unitPrice,
      stockKg: item.stockKg,
      quantityKg: index === 0 ? Math.min(100, item.stockKg) : 0,
      isSelected: index === 0 && item.stockKg > 0,
    })),
  );
  const [address, setAddress] = useState("");
  const [dbAddresses, setDbAddresses] = useState<CustomerAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodName>(paymentMethods[0].name);
  const [shippingMode, setShippingMode] = useState<"PT_INFO_TANI" | "SELF_PICKUP">("PT_INFO_TANI");

  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Fetch browser current location as customer coordinate fallback
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  // Compute straight-line delivery distance using Haversine
  useEffect(() => {
    const lat2 = Number(farmerLatitude);
    const lon2 = Number(farmerLongitude);

    if (!Number.isFinite(lat2) || !Number.isFinite(lon2) || (lat2 === 0 && lon2 === 0)) {
      setCalculatedDistance(null);
      return;
    }

    // Try resolving coordinates from address input first
    const resolvedCoords = getCoordsFromAddressText(address);
    const customerLat = resolvedCoords?.lat ?? userGpsCoords?.lat;
    const customerLng = resolvedCoords?.lng ?? userGpsCoords?.lng;

    if (customerLat === undefined || customerLng === undefined) {
      setCalculatedDistance(null);
      return;
    }

    const dist = calculateHaversine(customerLat, customerLng, lat2, lon2);
    setCalculatedDistance(dist);
  }, [address, userGpsCoords, farmerLatitude, farmerLongitude]);
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  // Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [customTotalPay, setCustomTotalPay] = useState<number>(0);
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
  const canPay = hasCatalogProducts && totalQuantityKg > 0 && address.trim().length > 8;

  useEffect(() => {
    setLineItems(
      baseProducts.map((item, index) => ({
        productId: item.id,
        productName: item.name,
        unitPrice: item.unitPrice,
        stockKg: item.stockKg,
        quantityKg: index === 0 ? Math.min(100, item.stockKg) : 0,
        isSelected: index === 0 && item.stockKg > 0,
      })),
    );
  }, [baseProducts]);

  // Verify stored session token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!isHydrated || !token) {
      return;
    }

    void (async () => {
      try {
        const verified = await verifyStoredSession();
        if (!verified) {
          setSession(null);
          setCustomer(null);
        }
      } catch {
        setSession(null);
        setCustomer(null);
      }
    })();
  }, [isHydrated]);

  const fetchDatabaseProfileData = async (token: string) => {
    try {
      // Fetch profile
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const payload = await profileRes.json();
        if (payload.data) {
          setCustomer(payload.data);
          setPhoneNumber(payload.data.phone || "");
        }
      }

      // Fetch addresses
      const addrRes = await fetch("/api/profile/addresses", {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
      console.error("Gagal memuat profil database di katalog:", err);
    }
  };

  // Ambil alamat dan rekening bank dari database jika user login
  useEffect(() => {
    if (!isHydrated) return;
    const token = getStoredToken();
    if (token) {
      fetchDatabaseProfileData(token);
    }
  }, [isHydrated]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const isSignup = authModalMode === "signup";
    const email = authForm.email.trim().toLowerCase();

    try {
      if (isSignup) {
        if (!authForm.name.trim() || !email || !authForm.phone.trim()) {
          throw new Error("Lengkapi nama, email, dan nomor telepon.");
        }

        if (authForm.password.trim().length < 6) {
          throw new Error("Password minimal 6 karakter.");
        }

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authForm.name.trim(),
            email,
            phone: authForm.phone.trim(),
            password: authForm.password.trim(),
            role: "CUSTOMER",
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Gagal mendaftarkan akun customer.");
        }

        const user = payload.user;
        const token = payload.token;
        const account = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: authForm.phone.trim(),
          password: authForm.password.trim(),
          createdAt: new Date().toISOString(),
        };

        saveCustomer(account);
        saveToken(token);
        const sessionData = {
          id: user.id,
          email: user.email,
          name: user.name,
          token: token,
          createdAt: new Date().toISOString(),
        };
        saveSession(sessionData);
        setSession(sessionData);
        setCustomer(account);
        setAuthSuccess("Registrasi berhasil! Memuat data Anda...");

        // Fetch their database details (addresses/banks)
        await fetchDatabaseProfileData(token);

        setTimeout(() => {
          setIsAuthModalOpen(false);
          void handlePayment(sessionData, account);
        }, 1000);

      } else {
        if (!email || !authForm.password.trim()) {
          throw new Error("Lengkapi email dan password.");
        }

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: authForm.password.trim() }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Email atau password tidak cocok.");
        }

        const user = payload.user;
        const token = payload.token;
        const account = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          password: authForm.password.trim(),
          createdAt: new Date().toISOString(),
        };

        saveCustomer(account);
        saveToken(token);
        const sessionData = {
          id: user.id,
          email: user.email,
          name: user.name,
          token: token,
          createdAt: new Date().toISOString(),
        };
        saveSession(sessionData);
        setSession(sessionData);
        setCustomer(account);
        setAuthSuccess("Login berhasil! Memuat data Anda...");

        // Fetch their database details (addresses/banks)
        await fetchDatabaseProfileData(token);

        setTimeout(() => {
          setIsAuthModalOpen(false);
          void handlePayment(sessionData, account);
        }, 1000);
      }
    } catch (err) {
      setAuthError((err as Error).message || "Terjadi kesalahan.");
    } finally {
      setAuthLoading(false);
    }
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

  async function handlePayment(sessionOverride?: AuthSession | null, customerOverride?: CustomerAccount | null) {
    const activeSession = sessionOverride || currentSession;
    const activeCustomer = customerOverride || currentCustomer;

    if (!activeSession || !activeCustomer) {
      setAuthPromptStep("ask");
      setAuthError(null);
      setAuthSuccess(null);
      setIsAuthModalOpen(true);
      return;
    }

    if (!canPay) {
      setPaymentNotice("Isi jumlah dan alamat pengiriman terlebih dahulu.");
      return;
    }

    if (!hasCatalogProducts) {
      setPaymentNotice("Produk belum tersedia di katalog ini. Admin perlu menambahkan produk dulu.");
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
        quantityKg: item.quantityKg,
      }));

      const productSummary = selectedItems
        .map((item) => `${item.productName} (${item.quantityKg.toLocaleString()} kg)`)
        .join(", ");

      const headers: HeadersInit = { "Content-Type": "application/json" };
      const token = activeSession?.token || getStoredToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Tentukan atau simpan alamat ke database terlebih dahulu
      let finalAddressId = addressId;
      const matchedAddress = dbAddresses.find(
        (a) => a.fullAddress.trim().toLowerCase() === address.trim().toLowerCase()
      );

      const phoneNum = activeCustomer?.phone || activeCustomer?.phoneNumber || "08xxxxxxxxxx";

      if (matchedAddress) {
        finalAddressId = matchedAddress.id;
      } else if (token) {
        setPaymentNotice("Menyimpan alamat pengiriman baru ke database...");
        try {
          const addrRes = await fetch("/api/profile/addresses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              label: "Alamat Pengiriman Baru",
              recipientName: activeSession?.name || "Customer InfoTani",
              phoneNumber: phoneNum,
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

      setPaymentNotice("Membuat pesanan...");

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: orderItems,
          addressId: finalAddressId,
          customerBankAccountId: bankAccountId,
          logisticsVehicleId: null,
          logisticsCost,
          paymentMethod,
          logisticsLabel: shippingMode === "PT_INFO_TANI" ? "Kirim via PT InfoTani" : "Pick Up Sendiri",
          notes: `Alamat tujuan: ${address.trim()}\nPenerima: ${activeSession?.name || activeCustomer?.name}\nNo WA: ${phoneNum}`,
          total: customTotalPay > 0 ? customTotalPay : totalPay,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || "Gagal membuat pesanan");
      }

      const orderData = await orderResponse.json();
      const orderId = orderData?.data?.id as string;
      const billCode = (orderData?.data?.trackingId as string) || orderId;

      if (!orderId) {
        throw new Error("Order berhasil dibuat, tapi ID order tidak ditemukan.");
      }

      setPaymentNotice("Memproses pembayaran...");

      // Finalize the payment status to SUCCESS immediately
      try {
        const payConfirmRes = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            paymentMethod: resolvePaymentMethod(paymentMethod),
          }),
        });
        if (!payConfirmRes.ok) {
          const errData = await payConfirmRes.json().catch(() => null);
          console.error("Gagal finalisasi pembayaran:", errData);
        }
      } catch (err) {
        console.error("Error finalisasi pembayaran:", err);
      }

      setIsPaymentModalOpen(false);

      const truckLocation = getTruckLocation(address.trim());
      const selectedFleetSummary = shippingMode === "PT_INFO_TANI" ? fleetSummary : "Ambil sendiri di lokasi petani";

      setReceipt({
        billCode,
        orderId,
        customerName: activeSession.name,
        paymentMethod,
        productSummary,
        quantityKg: totalQuantityKg,
        subtotal,
        logisticsCost,
        discountAmount: discountInfo.discountAmount,
        totalPay: customTotalPay > 0 ? customTotalPay : totalPay,
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

      setPaymentNotice("Order berhasil dibuat. Lanjutkan pembayaran dari metode yang dipilih.");
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          author: "petani",
          text: "Order sudah masuk sistem. Setelah pembayaran terverifikasi, admin akan lanjut proses pengiriman.",
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
      if (message === "Unauthorized") {
        clearSession();
        setSession(null);
        setCustomer(null);
        setAuthPromptStep("ask");
        setIsAuthModalOpen(true);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
        {!currentSession || !currentCustomer ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Login customer diperlukan sebelum checkout.</p>
            <p className="mt-1">Akun customer akan menyimpan riwayat transaksi dan status pembayaran.</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
            >
              Login / Daftar Customer
            </button>
          </div>
        ) : null}

        <div className="mb-4 flex items-center gap-2 text-indigo-700">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-slate-900">Menu Bayar</h3>
        </div>

        <p className="text-sm text-slate-600">Pilih produk yang ingin dibeli lalu isi quantity per produk (kg). Pilih metode pembayaran di bawah untuk langsung memproses transaksi.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const isActive = paymentMethod === method.name;

            return (
              <button
                key={method.name}
                type="button"
                onClick={() => setPaymentMethod(method.name)}
                className={`overflow-hidden rounded-3xl border text-left transition ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50"
                }`}
              >
                <div className="flex h-28 items-center justify-center bg-slate-50 px-4">
                  <Image
                    src={method.image || "/payment.webp"}
                    alt={method.name}
                    width={260}
                    height={96}
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-base font-semibold text-slate-900">{method.name}</p>
                  <p className="text-xs text-slate-500">{method.note}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rekening petani</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{displayBankName}</span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">a.n. {displayAccountHolder}</span>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
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
              Setelah memilih metode, lakukan pembayaran. Bill akan dibuat otomatis dan pesan terkirim ke admin.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {lineItems.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Produk tenant belum tersedia untuk dibeli. Admin perlu menambahkan produk di dashboard terlebih dahulu.
            </div>
          ) : lineItems.map((item) => {
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

        {currentSession && currentCustomer && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Profil Pembeli Terverifikasi</p>
            <div className="mt-2 text-sm text-slate-700 space-y-1">
              <p><strong>Nama:</strong> {currentCustomer?.name || currentSession?.name}</p>
              <p><strong>No. WA/Telepon:</strong> {phoneNumber || currentCustomer?.phone || "Belum diatur (Silakan atur di profil)"}</p>
            </div>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="address">
          Alamat Pengiriman
        </label>
        {currentSession && currentCustomer && dbAddresses.length > 0 && (
          <div className="mt-1 mb-2">
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white outline-none ring-indigo-200 transition focus:ring"
              onChange={(e) => {
                const selected = dbAddresses.find(a => a.id === e.target.value);
                if (selected) {
                  setAddress(selected.fullAddress);
                  setAddressId(selected.id);
                }
              }}
              value={addressId || ""}
            >
              <option value="" disabled>-- Pilih Alamat Tersimpan --</option>
              {dbAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.label} - {addr.fullAddress}
                </option>
              ))}
            </select>
          </div>
        )}
        <textarea
          id="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Contoh: Jl. Soekarno Hatta, Bandar Lampung"
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-indigo-200 transition focus:ring"
        />
        {calculatedDistance !== null && (
          <div className="mt-1.5 text-xs text-indigo-700 font-semibold flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 rounded-xl px-3 py-1.5">
            <span>📍 Jarak pengiriman:</span>
            <span><strong>{calculatedDistance.toFixed(1)} km</strong></span>
          </div>
        )}

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
          onClick={() => {
            if (currentSession && currentCustomer) {
              setCustomTotalPay(totalPay);
              setIsPaymentModalOpen(true);
            } else {
              handlePayment();
            }
          }}
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

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {authPromptStep === "ask" ? (
              <div className="text-center py-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Akun InfoTani</h3>
                <p className="text-sm text-slate-600 mb-6">Sebelum melanjutkan pembayaran, apakah Anda sudah memiliki akun InfoTani?</p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthPromptStep("form");
                      setAuthModalMode("login");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
                  >
                    Ya, Masuk ke Akun Saya
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/profile";
                    }}
                    className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 bg-slate-50 transition hover:bg-slate-100"
                  >
                    Belum, Buat Akun Baru
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthPromptStep("ask")}
                  className="mb-4 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
                >
                  ← Kembali
                </button>

                <div className="mb-6 flex justify-around border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`pb-1 text-sm font-semibold transition ${
                      authModalMode === "login"
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Login Akun
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("signup");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`pb-1 text-sm font-semibold transition ${
                      authModalMode === "signup"
                        ? "border-b-2 border-indigo-600 text-indigo-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Buat Akun Baru
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authModalMode === "signup" && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Nama Lengkap
                      </span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-slate-400 text-xs">👤</span>
                        <input
                          value={authForm.name}
                          onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                          className="w-full bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400"
                          placeholder="Nama Anda"
                          required
                        />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-slate-400 text-xs">✉️</span>
                      <input
                        type="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                        className="w-full bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </label>

                  {authModalMode === "signup" && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Nomor Telepon
                      </span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-slate-400 text-xs">📞</span>
                        <input
                          value={authForm.phone}
                          onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                          className="w-full bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400"
                          placeholder="08xxxxxxxxxx"
                          required
                        />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Password
                    </span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-slate-400 text-xs">🔒</span>
                      <input
                        type="password"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400"
                        placeholder="Password Anda"
                        required
                      />
                    </div>
                  </label>

                  {authError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
                      {authSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {authLoading ? "Memproses..." : authModalMode === "login" ? "Masuk Sekarang" : "Daftar & Masuk"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Pembayaran</h3>
            <p className="text-sm text-slate-600 mb-4">Silakan atur nominal pembayaran dan metode pembayaran sebelum melanjutkan.</p>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nominal Pembayaran (Rp)
                </span>
                <input
                  type="number"
                  value={customTotalPay}
                  onChange={(e) => setCustomTotalPay(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-sm outline-none placeholder:text-slate-400"
                  placeholder="Masukkan nominal"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Metode Pembayaran
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodName)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-sm outline-none"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.name} value={method.name}>
                      {method.name} - {method.note}
                    </option>
                  ))}
                </select>
              </label>

              {paymentNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                  {paymentNotice}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handlePayment()}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {isProcessing ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
