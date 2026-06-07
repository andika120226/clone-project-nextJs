export type CustomerAccount = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
};

export type LogisticsOption = {
  id: string;
  label: string;
  capacityKg: number;
  rentalFee: number;
  description: string;
};

export type CheckoutUnit = "kg" | "gram";

export type OrderItem = {
  productId: string;
  productName: string;
  farmerName: string;
  location: string;
  basePricePerKg: number;
  quantity: number;
  unit: CheckoutUnit;
  quantityKg: number;
  address: string;
  logisticsId: string;
  logisticsLabel: string;
  logisticsFee: number;
  paymentMethod: string;
  subtotal: number;
  total: number;
};

export type CustomerOrder = OrderItem & {
  id: string;
  createdAt: string;
  status: "Menunggu Bayar" | "Diproses" | "Dikirim" | "Selesai";
  trackingNote: string;
  truckLocation: string;
  destination: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantityKg: number;
    unitPrice: number;
    subtotal: number;
  }>;
  paymentStatus?: string;
  estimatedArrival?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
};

export type AuthSession = {
  id?: string;
  email: string;
  name: string;
  createdAt: string;
  token?: string;
};

const CUSTOMER_KEY = "infotani.customer.account";
const SESSION_KEY = "infotani.customer.session";
const ORDERS_KEY = "infotani.customer.orders";
const TOKEN_KEY = "infotani.customer.token";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredCustomer() {
  return readJson<CustomerAccount | null>(CUSTOMER_KEY, null);
}

export function saveCustomer(account: CustomerAccount) {
  writeJson(CUSTOMER_KEY, account);
  writeJson(SESSION_KEY, {
    email: account.email,
    name: account.name,
    createdAt: new Date().toISOString(),
  } satisfies AuthSession);
}

export function getCurrentSession() {
  return readJson<AuthSession | null>(SESSION_KEY, null);
}

export function saveSession(session: AuthSession) {
  writeJson(SESSION_KEY, session);
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(CUSTOMER_KEY);
}

export function saveToken(token: string) {
  writeJson(TOKEN_KEY, token);
}

export function getStoredToken() {
  return readJson<string | null>(TOKEN_KEY, null);
}

export async function verifyStoredSession() {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    return data.userId ? { id: data.userId, email: data.email } : null;
  } catch {
    return null;
  }
}

export function getStoredOrders() {
  return readJson<CustomerOrder[]>(ORDERS_KEY, []);
}

export function saveOrder(order: CustomerOrder) {
  const orders = getStoredOrders();
  writeJson(ORDERS_KEY, [order, ...orders]);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const logisticsOptions: LogisticsOption[] = [
  {
    id: "pickup-terbuka",
    label: "Pick-up Terbuka",
    capacityKg: 500,
    rentalFee: 120000,
    description: "Cocok untuk kiriman kecil dan akses jalan sempit.",
  },
  {
    id: "pickup-cargo",
    label: "Pick-up Cargo",
    capacityKg: 1000,
    rentalFee: 180000,
    description: "Pas untuk distribusi jarak pendek dan muatan ringan.",
  },
  {
    id: "truk-kecil",
    label: "Truk Kecil",
    capacityKg: 2000,
    rentalFee: 320000,
    description: "Ideal untuk muatan menengah antar-kecamatan.",
  },
  {
    id: "truk-sedang",
    label: "Truk Sedang",
    capacityKg: 4000,
    rentalFee: 520000,
    description: "Cocok untuk angkutan gabungan dan pengiriman reguler.",
  },
  {
    id: "fuso-cargo",
    label: "Fuso Cargo",
    capacityKg: 8000,
    rentalFee: 980000,
    description: "Armada besar untuk pengiriman grosir atau proyek besar.",
  },
];

export const paymentMethods = [
  "Transfer Bank",
  "QRIS",
  "Virtual Account",
  "Cash on Delivery",
];

export function createOrderId() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export function getPrimaryTruckLabel(logisticsId: string) {
  if (logisticsId === "pickup-terbuka") {
    return "Pick-up Terbuka Lampung 07";
  }

  if (logisticsId === "pickup-cargo") {
    return "Pick-up Cargo InfoTani 12";
  }

  if (logisticsId === "truk-kecil") {
    return "Truk Kecil InfoTani 15";
  }

  if (logisticsId === "truk-sedang") {
    return "Truk Sedang InfoTani 18";
  }

  return "Fuso Cargo Distribusi 21";
}

export function getTruckLocation(destination: string) {
  const normalized = destination.toLowerCase();

  if (normalized.includes("bandar lampung")) {
    return "Rest Area Rajabasa";
  }

  if (normalized.includes("lampung tengah")) {
    return "Gudang Seputih Raman";
  }

  if (normalized.includes("lampung selatan")) {
    return "Pos Transit Sidomulyo";
  }

  return "Rute utama distribusi";
}
