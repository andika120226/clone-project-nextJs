export type CustomerAccount = {
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
};

export type AuthSession = {
  email: string;
  name: string;
  createdAt: string;
};

const CUSTOMER_KEY = "infotani.customer.account";
const SESSION_KEY = "infotani.customer.session";
const ORDERS_KEY = "infotani.customer.orders";

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
    id: "pickup",
    label: "Pick-up",
    capacityKg: 800,
    rentalFee: 150000,
    description: "Cocok untuk kiriman kecil dan rute dalam kota.",
  },
  {
    id: "colt-diesel",
    label: "Colt Diesel",
    capacityKg: 3500,
    rentalFee: 450000,
    description: "Pas untuk distribusi antarkecamatan dengan volume menengah.",
  },
  {
    id: "fuso",
    label: "Fuso",
    capacityKg: 12000,
    rentalFee: 980000,
    description: "Armada besar untuk pengiriman grosir atau proyek reguler.",
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
  if (logisticsId === "pickup") {
    return "Pick-up Lampung 07";
  }

  if (logisticsId === "colt-diesel") {
    return "Colt Diesel InfoTani 12";
  }

  return "Fuso Distribusi 18";
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
