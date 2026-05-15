"use client";

import { DATA_TANI } from "@/lib/data-dummy";

export type AdminCatalog = {
  id: number;
  code: string;
  name: string;
  region: string;
};

export type AdminAccount = {
  name: string;
  email: string;
  password: string;
  assignedCatalogId: number;
  tenantId: string;
  createdAt: string;
};

export type AdminSession = {
  email: string;
  name: string;
  assignedCatalogId: number;
  tenantId: string;
  createdAt: string;
};

export type ProductStockStatus = "Ready" | "Menipis";

export type AdminProduct = {
  id: string;
  tenantId: string;
  name: string;
  stockKg: number;
  stockStatus: ProductStockStatus;
  imageUrl: string;
  pricePerKg?: number;
  createdAt: string;
  updatedAt: string;
};

export type ShippingOption = "PT_INFO_TANI" | "SELF_PICKUP";

export type DeliveryStatus =
  | "Konfirmasi"
  | "Proses"
  | "Berangkat"
  | "Selesai"
  | "Dibatalkan";

export type OrderLineItem = {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPrice: number;
};

export type LogisticsVehiclePlan = {
  vehicleType: string;
  capacityTon: number;
  additionalCost: number;
  count: number;
  subtotalCost: number;
};

export type LogisticsAnalysisResult = {
  totalWeightTon: number;
  estimatedVehicleCount: number;
  totalAdditionalCost: number;
  recommendation: LogisticsVehiclePlan[];
  notes: string;
};

export type AdminOrder = {
  id: string;
  tenantId: string;
  customerName: string;
  customerEmail: string;
  billCode: string;
  createdAt: string;
  paymentMethod: string;
  shippingOption: ShippingOption;
  deliveryStatus: DeliveryStatus;
  shipmentWeightTon: number;
  lineItems: OrderLineItem[];
  subtotal: number;
  logisticsAnalysis: LogisticsAnalysisResult;
  logisticsTypeLabel: string;
  logisticsAdditionalCost: number;
  totalPay: number;
  truckLocationLabel: string;
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED";
  messages?: OrderMessage[];
};

export type OrderMessage = {
  id: string;
  sender: "CUSTOMER" | "ADMIN" | "SYSTEM";
  message: string;
  status: "UNREAD" | "READ";
  createdAt: string;
};

export type FarmerProfile = {
  tenantId: string;
  farmerName: string;
  profilePhoto: string;
  catalogBanner: string;
  description: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type ShipmentTracking = {
  tenantId: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  vehicleLabel: string;
  truckLocationLabel: string;
  latitude: number;
  longitude: number;
  status: DeliveryStatus;
  updatedAt: string;
};

type DashboardPoint = {
  label: string;
  value: number;
};

const ADMIN_ACCOUNTS_KEY = "infotani.admin.accounts";
const ADMIN_SESSION_KEY = "infotani.admin.session";
const SHARED_TRACKING_KEY = "infotani.shared.tracking";
const CATALOG_COUNT = 15;

const DEFAULT_IMAGE = "/image/gambar13.jpg";

const FLEET_OPTIONS = [
  { vehicleType: "Pick-up Terbuka", capacityTon: 0.5, additionalCost: 120000 },
  { vehicleType: "Pick-up Cargo", capacityTon: 1, additionalCost: 180000 },
  { vehicleType: "Truk Kecil", capacityTon: 2, additionalCost: 320000 },
  { vehicleType: "Truk Sedang", capacityTon: 4, additionalCost: 520000 },
  { vehicleType: "Fuso Cargo", capacityTon: 8, additionalCost: 980000 },
] as const;

function getDefaultPriceByProductName(productName: string) {
  const lower = productName.toLowerCase();

  if (lower.includes("kopi")) {
    return 62000;
  }
  if (lower.includes("cabai") || lower.includes("cabe")) {
    return 36000;
  }
  if (lower.includes("padi")) {
    return 13000;
  }
  if (lower.includes("jagung")) {
    return 9800;
  }

  return 15000;
}

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

function toTenantKey(tenantId: string, suffix: string) {
  return `infotani.admin.tenant.${tenantId}.${suffix}`;
}

export function sampleCatalogs(): AdminCatalog[] {
  return Array.from({ length: CATALOG_COUNT }).map((_, index) => {
    const id = index + 1;

    return {
      id,
      code: `CAT-${id.toString().padStart(2, "0")}`,
      name: `Slot Katalog ${id}`,
      region: "Belum diatur",
    };
  });
}

export function assignCatalogForEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = getStoredAdmin(normalizedEmail);
  if (existing) {
    return getTenantCatalog(existing.assignedCatalogId);
  }

  const accounts = getAccounts();
  const usedCatalogIds = new Set(accounts.map((item) => item.assignedCatalogId));
  const available = sampleCatalogs().find((catalog) => !usedCatalogIds.has(catalog.id));
  if (available) {
    return available;
  }

  const catalogs = sampleCatalogs();
  const idx = Math.abs(hashCode(normalizedEmail)) % catalogs.length;
  return catalogs[idx];
}

function hashCode(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function createTenantId(email: string) {
  return `tenant-${Math.abs(hashCode(email.trim().toLowerCase()))}`;
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getAccounts() {
  return readJson<AdminAccount[]>(ADMIN_ACCOUNTS_KEY, []);
}

function saveAccounts(accounts: AdminAccount[]) {
  writeJson(ADMIN_ACCOUNTS_KEY, accounts);
}

export function getStoredAdmin(email?: string): AdminAccount | null {
  const accounts = getAccounts();
  if (!email) {
    return accounts[0] ?? null;
  }

  return accounts.find((item) => item.email === email.toLowerCase()) ?? null;
}

export function saveAdminAccount(input: {
  name: string;
  email: string;
  password: string;
  assignedCatalogId: number;
}) {
  const email = input.email.trim().toLowerCase();
  const accounts = getAccounts();
  const found = accounts.find((item) => item.email === email);

  if (found) {
    found.name = input.name;
    found.password = input.password;
    found.assignedCatalogId = input.assignedCatalogId;
    saveAccounts(accounts);
    return found;
  }

  const account: AdminAccount = {
    name: input.name,
    email,
    password: input.password,
    assignedCatalogId: input.assignedCatalogId,
    tenantId: createTenantId(email),
    createdAt: new Date().toISOString(),
  };

  accounts.push(account);
  saveAccounts(accounts);
  ensureTenantBootstrapped(account);
  return account;
}

export function validateAdminLogin(email: string, password: string) {
  const account = getStoredAdmin(email.trim().toLowerCase());
  if (!account) {
    return null;
  }

  if (account.password !== password) {
    return null;
  }

  return account;
}

export function saveAdminSession(account: Pick<AdminAccount, "email" | "name" | "assignedCatalogId" | "tenantId">) {
  const session: AdminSession = {
    email: account.email,
    name: account.name,
    assignedCatalogId: account.assignedCatalogId,
    tenantId: account.tenantId,
    createdAt: new Date().toISOString(),
  };

  writeJson(ADMIN_SESSION_KEY, session);
}

export function getAdminSession() {
  return readJson<AdminSession | null>(ADMIN_SESSION_KEY, null);
}

export function clearAdminSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function ensureAdminSession() {
  const session = getAdminSession();
  if (!session) {
    return null;
  }

  const account = getStoredAdmin(session.email);
  if (!account) {
    clearAdminSession();
    return null;
  }

  ensureTenantBootstrapped(account);
  return { session, account };
}

function ensureTenantBootstrapped(account: AdminAccount) {
  const productsKey = toTenantKey(account.tenantId, "products");
  const ordersKey = toTenantKey(account.tenantId, "orders");
  const historyKey = toTenantKey(account.tenantId, "history");
  const profileKey = toTenantKey(account.tenantId, "profile");
  const trackingKey = toTenantKey(account.tenantId, "tracking");

  const products = readJson<AdminProduct[]>(productsKey, []);
  if (products.length === 1 && isLegacySeededProduct(products[0], account)) {
    writeJson(productsKey, []);
  }

  const orders = readJson<AdminOrder[]>(ordersKey, []);
  if (orders.length === 2 && isLegacySeededOrderSet(orders, account)) {
    writeJson(ordersKey, []);
    writeJson(historyKey, []);
  }

  const profile = readJson<FarmerProfile | null>(profileKey, null);
  if (profile && isLegacySeededProfile(profile, account)) {
    writeJson(profileKey, null);
  }

  const tracking = readJson<ShipmentTracking[]>(trackingKey, []);
  if (tracking.length === 0) {
    writeJson(trackingKey, []);
  }
}

function isLegacySeededProduct(product: AdminProduct, account: AdminAccount) {
  const related = DATA_TANI[(account.assignedCatalogId - 1) % DATA_TANI.length];
  return (
    product.name === related?.nama_produk &&
    product.stockKg === (related?.stok ?? product.stockKg) &&
    (product.imageUrl === related?.gambar_produk?.replace("/image/", "/") || product.imageUrl === DEFAULT_IMAGE)
  );
}

function isLegacySeededProfile(profile: FarmerProfile, account: AdminAccount) {
  const related = DATA_TANI[(account.assignedCatalogId - 1) % DATA_TANI.length];
  return (
    profile.farmerName === (related?.nama_petani ?? account.name) &&
    profile.description === related?.deskripsi_panen &&
    profile.profilePhoto === related?.foto_profil?.replace("/image/", "/") &&
    profile.catalogBanner === related?.gambar_banner?.replace("/image/", "/")
  );
}

function isLegacySeededOrderSet(orders: AdminOrder[], account: AdminAccount) {
  const related = DATA_TANI[(account.assignedCatalogId - 1) % DATA_TANI.length];
  if (!related) {
    return false;
  }

  return orders.every((order) => order.tenantId === account.tenantId && order.lineItems.some((item) => item.productName === related.nama_produk));
}

export function getAdminAccountByCatalogId(assignedCatalogId: number) {
  return getAccounts().find((item) => item.assignedCatalogId === assignedCatalogId) ?? null;
}

export function getTenantCatalog(assignedCatalogId: number) {
  const catalogs = sampleCatalogs();
  return catalogs.find((item) => item.id === assignedCatalogId) ?? catalogs[0];
}

export function getTenantProducts(tenantId: string) {
  return readJson<AdminProduct[]>(toTenantKey(tenantId, "products"), []);
}

export function saveTenantProduct(tenantId: string, payload: Omit<AdminProduct, "tenantId" | "createdAt" | "updatedAt" | "id"> & { id?: string }) {
  const key = toTenantKey(tenantId, "products");
  const products = getTenantProducts(tenantId);

  if (payload.id) {
    const idx = products.findIndex((item) => item.id === payload.id);
    if (idx >= 0) {
      products[idx] = {
        ...products[idx],
        ...payload,
        tenantId,
        updatedAt: new Date().toISOString(),
      };
      writeJson(key, products);
      return products[idx];
    }
  }

  const created: AdminProduct = {
    id: `prd-${Date.now()}`,
    tenantId,
    name: payload.name,
    stockKg: payload.stockKg,
    stockStatus: payload.stockStatus,
    imageUrl: payload.imageUrl || DEFAULT_IMAGE,
    pricePerKg: payload.pricePerKg ?? getDefaultPriceByProductName(payload.name),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeJson(key, [created, ...products]);
  return created;
}

export function deleteTenantProduct(tenantId: string, productId: string) {
  const key = toTenantKey(tenantId, "products");
  const next = getTenantProducts(tenantId).filter((item) => item.id !== productId);
  writeJson(key, next);
  return next;
}

export function getTenantOrders(tenantId: string) {
  return readJson<AdminOrder[]>(toTenantKey(tenantId, "orders"), []);
}

export function saveTenantOrder(tenantId: string, payload: Omit<AdminOrder, "id" | "tenantId" | "createdAt" | "billCode">) {
  const key = toTenantKey(tenantId, "orders");
  const orders = getTenantOrders(tenantId);

  const created: AdminOrder = {
    ...payload,
    paymentStatus: payload.paymentStatus ?? "SUCCESS",
    messages: payload.messages ?? [],
    id: `ord-${Date.now()}`,
    tenantId,
    createdAt: new Date().toISOString(),
    billCode: createBillCode(),
  };

  writeJson(key, [created, ...orders]);
  return created;
}

export function updateTenantOrderStatus(tenantId: string, orderId: string, nextStatus: DeliveryStatus) {
  const key = toTenantKey(tenantId, "orders");
  const historyKey = toTenantKey(tenantId, "history");
  const orders = getTenantOrders(tenantId);
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return null;
  }

  order.deliveryStatus = nextStatus;
  order.messages = [
    {
      id: createMessageId(),
      sender: "SYSTEM",
      status: "UNREAD",
      createdAt: new Date().toISOString(),
      message: `Status pesanan diubah menjadi ${nextStatus}.`,
    },
    ...(order.messages ?? []),
  ];
  order.truckLocationLabel =
    nextStatus === "Berangkat"
      ? "Armada menuju lokasi customer"
      : nextStatus === "Selesai"
        ? "Pesanan selesai dikirim"
        : nextStatus === "Dibatalkan"
          ? "Pengiriman dibatalkan"
          : order.truckLocationLabel;

  writeJson(key, [...orders]);

  if (nextStatus === "Selesai") {
    const history = getTenantHistory(tenantId);
    if (!history.some((item) => item.id === order.id)) {
      writeJson(historyKey, [order, ...history]);
    }
  }

  return order;
}

export function getTenantHistory(tenantId: string) {
  return readJson<AdminOrder[]>(toTenantKey(tenantId, "history"), []);
}

export function getFarmerProfile(tenantId: string) {
  return readJson<FarmerProfile | null>(toTenantKey(tenantId, "profile"), null);
}

export function saveFarmerProfile(tenantId: string, payload: Omit<FarmerProfile, "tenantId" | "updatedAt">) {
  const profile: FarmerProfile = {
    tenantId,
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  writeJson(toTenantKey(tenantId, "profile"), profile);
  return profile;
}

export function getShipmentTracking(tenantId: string) {
  return readJson<ShipmentTracking[]>(toTenantKey(tenantId, "tracking"), []);
}

export function upsertShipmentTracking(
  tenantId: string,
  payload: Omit<ShipmentTracking, "tenantId" | "updatedAt">,
) {
  const key = toTenantKey(tenantId, "tracking");
  const all = getShipmentTracking(tenantId);
  const idx = all.findIndex((item) => item.orderId === payload.orderId);
  const next: ShipmentTracking = {
    tenantId,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    all[idx] = next;
  } else {
    all.unshift(next);
  }

  writeJson(key, all);
  syncSharedCustomerTracking(next);
  return next;
}

function syncSharedCustomerTracking(nextTracking: ShipmentTracking) {
  const list = readJson<ShipmentTracking[]>(SHARED_TRACKING_KEY, []);
  const idx = list.findIndex((item) => item.orderId === nextTracking.orderId);

  if (idx >= 0) {
    list[idx] = nextTracking;
  } else {
    list.unshift(nextTracking);
  }

  writeJson(SHARED_TRACKING_KEY, list);
}

export function getSharedShipmentTracking() {
  return readJson<ShipmentTracking[]>(SHARED_TRACKING_KEY, []);
}

export function analyzeLogisticsLoad(totalWeightTon: number): LogisticsAnalysisResult {
  const safeWeight = Math.max(0.1, Number(totalWeightTon) || 0);
  const targetWeightKg = safeWeight * 1000;
  const fleetCombinations = generateFleetCombinations(targetWeightKg, 3);
  const bestPlan = fleetCombinations[0] ?? [FLEET_OPTIONS[FLEET_OPTIONS.length - 1]];

  const grouped = bestPlan.reduce<Map<string, LogisticsVehiclePlan>>((acc, vehicle) => {
    const existing = acc.get(vehicle.vehicleType);
    if (existing) {
      existing.count += 1;
      existing.subtotalCost += vehicle.additionalCost;
      return acc;
    }

    acc.set(vehicle.vehicleType, {
      vehicleType: vehicle.vehicleType,
      capacityTon: vehicle.capacityTon,
      additionalCost: vehicle.additionalCost,
      count: 1,
      subtotalCost: vehicle.additionalCost,
    });

    return acc;
  }, new Map());

  const recommendation = Array.from(grouped.values()).sort((a, b) => b.capacityTon - a.capacityTon);
  const totalAdditionalCost = recommendation.reduce((sum, item) => sum + item.subtotalCost, 0);
  const estimatedVehicleCount = recommendation.reduce((sum, item) => sum + item.count, 0);

  return {
    totalWeightTon: safeWeight,
    estimatedVehicleCount,
    totalAdditionalCost,
    recommendation,
    notes:
      "Rekomendasi armada dipilih dari kombinasi paling efisien dengan batas maksimal 3 kendaraan.",
  };
}

function generateFleetCombinations(targetWeightKg: number, maxVehicles: number) {
  const all: Array<(typeof FLEET_OPTIONS)[number][]> = [];

  function walk(current: (typeof FLEET_OPTIONS)[number][], depth: number) {
    const currentCapacity = current.reduce((sum, vehicle) => sum + vehicle.capacityTon * 1000, 0);

    if (currentCapacity >= targetWeightKg || depth === maxVehicles) {
      if (currentCapacity >= targetWeightKg && current.length > 0) {
        all.push([...current]);
      }
      return;
    }

    for (const vehicle of FLEET_OPTIONS) {
      current.push(vehicle);
      walk(current, depth + 1);
      current.pop();
    }
  }

  walk([], 0);

  return all
    .map((items) => ({
      items,
      cost: items.reduce((sum, item) => sum + item.additionalCost, 0),
      capacity: items.reduce((sum, item) => sum + item.capacityTon * 1000, 0),
    }))
    .sort((a, b) => a.cost - b.cost || a.capacity - b.capacity)
    .map((item) => item.items);
}

export function getFleetOptions() {
  return [...FLEET_OPTIONS];
}

export function getPriceByProductName(productName: string) {
  return getDefaultPriceByProductName(productName);
}

export function calculateDiscountedLogisticsCost(totalCost: number, vehicleCount: number) {
  const discountPercentage = vehicleCount > 0 && vehicleCount <= 3 ? 35 : 0;
  const discountAmount = Math.round((totalCost * discountPercentage) / 100);

  return {
    discountPercentage,
    discountAmount,
    totalAfterDiscount: totalCost - discountAmount,
  };
}

export function buildOrderPaymentMessage(params: {
  customerName: string;
  productName: string;
  billCode: string;
  totalPay: number;
  paymentMethod: string;
}) {
  return {
    id: createMessageId(),
    sender: "SYSTEM" as const,
    status: "UNREAD" as const,
    createdAt: new Date().toISOString(),
    message: `Pembayaran sukses dari ${params.customerName} untuk ${params.productName}. Bill ${params.billCode}. Total ${toRupiah(params.totalPay)} via ${params.paymentMethod}.`,
  };
}

export function appendTenantOrderMessage(tenantId: string, orderId: string, message: OrderMessage) {
  const key = toTenantKey(tenantId, "orders");
  const orders = getTenantOrders(tenantId);
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return null;
  }

  order.messages = order.messages ? [message, ...order.messages] : [message];
  order.paymentStatus = order.paymentStatus ?? "SUCCESS";
  writeJson(key, orders);
  return order;
}

export function summarizeOrderMessages(tenantId: string) {
  return getTenantOrders(tenantId).flatMap((order) => order.messages ?? []);
}

export function createBillCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function toRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDashboardSalesPoints(tenantId: string): {
  daily: DashboardPoint[];
  weekly: DashboardPoint[];
} {
  const orders = getTenantOrders(tenantId);

  const daily: DashboardPoint[] = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = date.toLocaleDateString("id-ID", { weekday: "short" });
    const value = orders
      .filter((order) => {
        const d = new Date(order.createdAt);
        return (
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, item) => sum + item.totalPay, 0);

    return { label, value };
  });

  const weekly: DashboardPoint[] = Array.from({ length: 4 }).map((_, index) => {
    const start = new Date();
    start.setDate(start.getDate() - (27 - index * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const value = orders
      .filter((order) => {
        const d = new Date(order.createdAt).getTime();
        return d >= start.getTime() && d <= end.getTime();
      })
      .reduce((sum, item) => sum + item.totalPay, 0);

    return { label: `Minggu ${index + 1}`, value };
  });

  return { daily, weekly };
}

export function isImageMimeAllowed(type: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

export function isImageFileExtensionAllowed(ext: string) {
  const lower = ext.toLowerCase().replace(/^\./, ""); // Remove leading dot if present
  return lower === "jpg" || lower === "jpeg" || lower === "png" || lower === "webp";
}
