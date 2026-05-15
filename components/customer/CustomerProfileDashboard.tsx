"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CircleUserRound,
  CreditCard,
  House,
  LogOut,
  PackageCheck,
  ReceiptText,
  Shield,
  TicketPercent,
  Truck,
  Upload,
  UserRound,
  Warehouse,
  LockKeyhole,
  Plus,
  User,
} from "lucide-react";
import {
  clearSession,
  getCurrentSession,
  getStoredCustomer,
  getStoredOrders,
  type CustomerOrder,
} from "@/lib/customer-store";
import { getSharedShipmentTracking, type ShipmentTracking } from "@/lib/admin-store";

type SidebarKey =
  | "profil"
  | "bank"
  | "alamat"
  | "password"
  | "pesanan"
  | "notifikasi"
  | "voucher";

type AddressEntry = {
  id: string;
  label: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  detail: string;
  isDefault: boolean;
};

type ProfileForm = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  avatar?: string;
};

type SidebarItem = {
  key: SidebarKey;
  label: string;
  icon: typeof UserRound;
};

const sidebarSections: Array<{
  title: string;
  items: SidebarItem[];
}> = [
  {
    title: "Akun Saya",
    items: [
      { key: "profil", label: "Profil", icon: UserRound },
      { key: "bank", label: "Bank & Kartu", icon: CreditCard },
      { key: "alamat", label: "Alamat", icon: Warehouse },
      { key: "password", label: "Ubah Password", icon: LockKeyhole },
    ],
  },
  {
    title: "Transaksi",
    items: [
      { key: "pesanan", label: "Pesanan Saya", icon: PackageCheck },
      { key: "notifikasi", label: "Notifikasi", icon: Bell },
      { key: "voucher", label: "Voucher", icon: TicketPercent },
    ],
  },
];

const orderTabs = [
  "Belum Bayar",
  "Dikemas",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
] as const;

const motionSection = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

function getLocalStorageValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
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

function setLocalStorageValue(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function safeParseDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

function normalizeAvatar(path: string) {
  return path.replace("/image/", "/");
}

function createDefaultProfile(): ProfileForm {
  const customer = getStoredCustomer();
  const session = getCurrentSession();

  return {
    username: session?.name?.split(" ")[0] ?? customer?.name?.split(" ")[0] ?? "customer",
    fullName: customer?.name ?? session?.name ?? "Customer InfoTani",
    email: customer?.email ?? session?.email ?? "customer@infotani.id",
    phone: customer?.phone ?? "08xxxxxxxxxx",
    gender: "Laki-laki",
    birthDate: "1998-01-01",
    avatar: customer?.email ? undefined : undefined,
  };
}

function createDefaultAddresses(): AddressEntry[] {
  return [
    {
      id: "alamat-1",
      label: "Rumah Utama",
      province: "Lampung",
      city: "Bandar Lampung",
      district: "Rajabasa",
      postalCode: "35142",
      detail: "Jl. Soekarno Hatta No. 12",
      isDefault: true,
    },
  ];
}

function createNotificationItems(selectedOrder: CustomerOrder | null) {
  const items = [
    {
      id: "notif-1",
      title: "Info akun",
      description: "Profil customer aktif dan siap dipakai untuk transaksi.",
      tone: "emerald",
      time: "Baru saja",
    },
  ];

  if (selectedOrder) {
    items.push(
      {
        id: "notif-2",
        title: "Status pesanan",
        description: `${selectedOrder.productName} saat ini ${selectedOrder.status.toLowerCase()}.`,
        tone: selectedOrder.status === "Dikirim" ? "cyan" : "slate",
        time: "2 menit lalu",
      },
      {
        id: "notif-3",
        title: "Tracking armada",
        description: `${selectedOrder.logisticsLabel} berada di ${selectedOrder.truckLocation}.`,
        tone: "amber",
        time: "5 menit lalu",
      },
    );
  } else {
    items.push({
      id: "notif-2",
      title: "Promo InfoTani",
      description: "Cek katalog untuk promo komoditas dan ongkos kirim.",
      tone: "cyan",
      time: "Hari ini",
    });
  }

  return items;
}

function toneClass(tone: string) {
  if (tone === "emerald") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  }

  if (tone === "cyan") {
    return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
  }

  if (tone === "amber") {
    return "border-amber-400/25 bg-amber-500/10 text-amber-100";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-100";
}

function getStatusTone(status: CustomerOrder["status"]) {
  if (status === "Dikirim") {
    return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "Diproses") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }

  if (status === "Selesai") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "Menunggu Bayar") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-100";
}

function createDeliveryProgress(status: CustomerOrder["status"]) {
  if (status === "Dikirim") {
    return 68;
  }

  if (status === "Diproses") {
    return 34;
  }

  if (status === "Selesai") {
    return 100;
  }

  if (status === "Menunggu Bayar") {
    return 12;
  }

  return 12;
}

export default function CustomerProfileDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(
    () => getCurrentSession()?.name ?? null,
  );
  const [activeMenu, setActiveMenu] = useState<SidebarKey>("profil");
  const [profile, setProfile] = useState<ProfileForm>(() =>
    createDefaultProfile(),
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordState, setPasswordState] = useState({ current: "", next: "", confirm: "" });
  const [bankState, setBankState] = useState({ bankName: "BCA", accountNumber: "1234567890", holderName: "Customer InfoTani" });
  const [addresses, setAddresses] = useState<AddressEntry[]>(() =>
    getLocalStorageValue<AddressEntry[]>("infotani.customer.addresses", createDefaultAddresses()),
  );
  const [addressDraft, setAddressDraft] = useState<AddressEntry>({
    id: "",
    label: "Rumah",
    province: "Lampung",
    city: "Bandar Lampung",
    district: "Rajabasa",
    postalCode: "35142",
    detail: "",
    isDefault: false,
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() =>
    getLocalStorageValue<string>("infotani.customer.address.selected", createDefaultAddresses()[0].id),
  );
  const [orders] = useState<CustomerOrder[]>(() => getStoredOrders());
  const [selectedTab, setSelectedTab] = useState<(typeof orderTabs)[number]>("Dikemas");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    () => getStoredOrders()[0]?.id ?? null,
  );
  const [voucherCode, setVoucherCode] = useState("");
  const [savedVouchers, setSavedVouchers] = useState<string[]>(() =>
    getLocalStorageValue<string[]>("infotani.customer.vouchers", ["AQUA10", "INFO5"]),
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId],
  );

  const deliveredOrder = useMemo(
    () => orders.find((order) => order.status === "Dikirim") ?? selectedOrder,
    [orders, selectedOrder],
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => order.status === selectedTab),
    [orders, selectedTab],
  );

  const notificationsFromOrders = useMemo(() => createNotificationItems(deliveredOrder), [deliveredOrder]);

  const activityMetrics = useMemo(
    () => ({
      totalOrders: orders.length,
      shipped: orders.filter((order) => order.status === "Dikirim").length,
      addresses: addresses.length,
      vouchers: savedVouchers.length,
    }),
    [addresses.length, orders, savedVouchers.length],
  );

  const activeNotifications = notificationsFromOrders;

  const sharedTracking = useMemo<ShipmentTracking | null>(() => {
    const session = getCurrentSession();
    if (!session) {
      return null;
    }

    const all = getSharedShipmentTracking();
    return (
      all.find((item) => item.customerEmail.toLowerCase() === session.email.toLowerCase()) ??
      null
    );
  }, []);

  const trackingActive = selectedOrder?.status === "Dikirim" || Boolean(sharedTracking);

  function persistProfile(nextProfile: ProfileForm) {
    setProfile(nextProfile);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("infotani.customer.profile", JSON.stringify(nextProfile));
    }
  }

  function handleLogout() {
    clearSession();
    setSessionName(null);
    router.refresh();
  }

  function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    persistProfile({ ...profile, avatar: objectUrl });
  }

  function handleAddAddress() {
    const nextAddress: AddressEntry = {
      ...addressDraft,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0 || addressDraft.isDefault,
    };

    const nextAddresses = nextAddress.isDefault
      ? addresses.map((address) => ({ ...address, isDefault: false })).concat(nextAddress)
      : [...addresses, nextAddress];

    setAddresses(nextAddresses);
    setLocalStorageValue("infotani.customer.addresses", nextAddresses);
    setSelectedAddressId(nextAddress.id);
    setLocalStorageValue("infotani.customer.address.selected", nextAddress.id);
  }

  function handleDefaultAddress(addressId: string) {
    const nextAddresses = addresses.map((address) => ({
      ...address,
      isDefault: address.id === addressId,
    }));

    setAddresses(nextAddresses);
    setLocalStorageValue("infotani.customer.addresses", nextAddresses);
    setSelectedAddressId(addressId);
    setLocalStorageValue("infotani.customer.address.selected", addressId);
  }

  function handleDeleteAddress(addressId: string) {
    const nextAddresses = addresses.filter((address) => address.id !== addressId);
    const normalized = nextAddresses.length
      ? nextAddresses.map((address, index) => ({
          ...address,
          isDefault: index === 0 ? true : address.isDefault,
        }))
      : createDefaultAddresses();

    setAddresses(normalized);
    setLocalStorageValue("infotani.customer.addresses", normalized);
    setSelectedAddressId(normalized[0].id);
    setLocalStorageValue("infotani.customer.address.selected", normalized[0].id);
  }

  function handleSaveVoucher() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    const nextVouchers = Array.from(new Set([...savedVouchers, code]));
    setSavedVouchers(nextVouchers);
    setLocalStorageValue("infotani.customer.vouchers", nextVouchers);
    setVoucherCode("");
  }

  function handlePasswordSave() {
    if (!passwordState.next || passwordState.next !== passwordState.confirm) {
      return;
    }

    setPasswordState({ current: "", next: "", confirm: "" });
  }

  if (!sessionName) {
    return (
      <main className="min-h-screen bg-[#0F172A] px-4 py-12 text-zinc-100 md:px-8">
        <section className="mx-auto max-w-4xl rounded-3xl border border-cyan-400/20 bg-white/5 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Profile Customer
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Login dulu untuk melihat profile customer.
          </h1>
          <p className="mt-3 text-sm text-zinc-300">
            Halaman ini menyimpan profil, alamat, pesanan, notifikasi, dan tracking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login?next=/profile"
              className="rounded-xl border border-cyan-400/25 bg-cyan-500/15 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Login Customer
            </Link>
            <Link
              href="/auth/signup?next=/profile"
              className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 font-semibold text-zinc-100 transition hover:border-cyan-400/25"
            >
              Sign-up Customer
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-6 text-zinc-100 md:px-8">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-cyan-400/20 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl lg:sticky lg:top-6 lg:h-fit">
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-white/5 p-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-cyan-400/20 bg-zinc-900 text-xl font-semibold text-cyan-200">
              {avatarPreview ? (
                <Image
                  src={normalizeAvatar(avatarPreview)}
                  alt="Avatar Customer"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{sessionName?.charAt(0)?.toUpperCase() ?? "C"}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-50">
                {profile.fullName}
              </p>
              <p className="text-xs text-zinc-400">Ubah profil customer</p>
            </div>
          </div>

          <nav className="mt-5 space-y-4">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                  {section.title}
                </p>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeMenu === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveMenu(item.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                          active
                            ? "border-cyan-400/25 bg-cyan-500/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                            : "border-transparent text-zinc-300 hover:border-cyan-400/15 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <div className="space-y-6">
          <header className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Profil Customer InfoTani
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-zinc-50 md:text-4xl">
                  Kelola akun, alamat, pesanan, dan tracking dalam satu tempat.
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-zinc-300">
                  Desain dark aqua glassmorphism dengan navigasi ala Shopee,
                  lengkap untuk pengelolaan customer.
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-cyan-400/15 bg-zinc-950/50 p-4 text-sm md:min-w-72 md:grid-cols-2">
                <div>
                  <p className="text-zinc-400">Pesanan</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-100">
                    {activityMetrics.totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Sedang dikirim</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-100">
                    {activityMetrics.shipped}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Alamat</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-100">
                    {activityMetrics.addresses}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Voucher</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-100">
                    {activityMetrics.vouchers}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeMenu === "profil" && (
              <motion.section
                key="profil"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <CircleUserRound className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Profil Diri</h2>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-5">
                    <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-cyan-400/20 bg-zinc-900 text-4xl text-cyan-100">
                      {avatarPreview ? (
                        <Image
                          src={normalizeAvatar(avatarPreview)}
                          alt="Foto profil customer"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10" />
                      )}
                    </div>

                    <div className="mt-5 space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        aria-label="Upload foto profil"
                        title="Upload foto profil"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Foto Profil
                      </button>

                      <div className="grid gap-3 text-sm">
                        <label className="block">
                          <span className="mb-1.5 block text-zinc-400">Username</span>
                          <input
                            value={profile.username}
                            onChange={(event) =>
                              persistProfile({ ...profile, username: event.target.value })
                            }
                            className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                            placeholder="username"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-zinc-400">Nama Lengkap</span>
                          <input
                            value={profile.fullName}
                            onChange={(event) =>
                              persistProfile({ ...profile, fullName: event.target.value })
                            }
                            className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                            placeholder="Nama lengkap"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-1.5 block text-zinc-400">Email</span>
                        <input
                          value={maskEmail(profile.email)}
                          readOnly
                          className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-900/70 px-4 py-3 text-zinc-300 outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-zinc-400">Nomor Telepon</span>
                        <input
                          value={profile.phone}
                          onChange={(event) =>
                            persistProfile({ ...profile, phone: event.target.value })
                          }
                          className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                          placeholder="08xxxxxxxxxx"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-zinc-400">Jenis Kelamin</span>
                        <select
                          value={profile.gender}
                          onChange={(event) =>
                            persistProfile({ ...profile, gender: event.target.value })
                          }
                          className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none"
                        >
                          <option>Laki-laki</option>
                          <option>Perempuan</option>
                          <option>Lainnya</option>
                        </select>
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-1.5 block text-zinc-400">Tanggal Lahir</span>
                        <input
                          type="date"
                          value={profile.birthDate}
                          onChange={(event) =>
                            persistProfile({ ...profile, birthDate: event.target.value })
                          }
                          className="w-full rounded-2xl border border-cyan-400/15 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none"
                        />
                      </label>

                      <div className="md:col-span-2 rounded-3xl border border-cyan-400/15 bg-white/5 p-4 text-sm text-zinc-300">
                        <div className="flex items-center gap-2 text-cyan-200">
                          <Shield className="h-4 w-4" />
                          <p className="font-semibold">Informasi Akun</p>
                        </div>
                        <p className="mt-2">Email tersensor: {maskEmail(profile.email)}</p>
                        <p className="mt-1">Tanggal lahir: {safeParseDate(profile.birthDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeMenu === "bank" && (
              <motion.section
                key="bank"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Bank & Kartu</h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <label className="block rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4">
                    <span className="mb-1.5 block text-zinc-400">Nama Bank</span>
                    <input
                      value={bankState.bankName}
                      onChange={(event) =>
                        setBankState({ ...bankState, bankName: event.target.value })
                      }
                      className="w-full rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                    />
                  </label>
                  <label className="block rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4">
                    <span className="mb-1.5 block text-zinc-400">Nomor Rekening</span>
                    <input
                      value={bankState.accountNumber}
                      onChange={(event) =>
                        setBankState({ ...bankState, accountNumber: event.target.value })
                      }
                      className="w-full rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                    />
                  </label>
                  <label className="block rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4">
                    <span className="mb-1.5 block text-zinc-400">Nama Pemilik</span>
                    <input
                      value={bankState.holderName}
                      onChange={(event) =>
                        setBankState({ ...bankState, holderName: event.target.value })
                      }
                      className="w-full rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                    />
                  </label>
                </div>

                <div className="mt-4 rounded-3xl border border-cyan-400/15 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                  Data bank disiapkan untuk kebutuhan pembayaran dan refund pesanan.
                </div>
              </motion.section>
            )}

            {activeMenu === "alamat" && (
              <motion.section
                key="alamat"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <House className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Manajemen Alamat</h2>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4">
                    <p className="text-sm font-semibold text-zinc-50">Tambah Alamat</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <input
                        value={addressDraft.label}
                        onChange={(event) => setAddressDraft({ ...addressDraft, label: event.target.value })}
                        placeholder="Label alamat"
                        className="rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <input
                        value={addressDraft.province}
                        onChange={(event) => setAddressDraft({ ...addressDraft, province: event.target.value })}
                        placeholder="Provinsi"
                        className="rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <input
                        value={addressDraft.city}
                        onChange={(event) => setAddressDraft({ ...addressDraft, city: event.target.value })}
                        placeholder="Kota"
                        className="rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <input
                        value={addressDraft.district}
                        onChange={(event) => setAddressDraft({ ...addressDraft, district: event.target.value })}
                        placeholder="Kecamatan"
                        className="rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <input
                        value={addressDraft.postalCode}
                        onChange={(event) => setAddressDraft({ ...addressDraft, postalCode: event.target.value })}
                        placeholder="Kode Pos"
                        className="rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <textarea
                        value={addressDraft.detail}
                        onChange={(event) => setAddressDraft({ ...addressDraft, detail: event.target.value })}
                        placeholder="Detail alamat"
                        className="min-h-24 rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <label className="flex items-center gap-2 text-zinc-300">
                        <input
                          type="checkbox"
                          checked={addressDraft.isDefault}
                          onChange={(event) =>
                            setAddressDraft({ ...addressDraft, isDefault: event.target.checked })
                          }
                        />
                        Jadikan alamat default
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400"
                      >
                        <Plus className="h-4 w-4" />
                        Simpan Alamat
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <article
                        key={address.id}
                        className={`rounded-3xl border p-4 text-sm ${
                          address.id === selectedAddressId
                            ? "border-cyan-400/25 bg-cyan-500/10"
                            : "border-cyan-400/10 bg-zinc-950/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-50">{address.label}</p>
                            <p className="mt-1 text-zinc-300">
                              {address.detail}
                            </p>
                            <p className="mt-2 text-zinc-400">
                              {address.district}, {address.city}, {address.province} - {address.postalCode}
                            </p>
                          </div>
                          {address.isDefault && (
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleDefaultAddress(address.id)}
                            className="rounded-full border border-cyan-400/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/10"
                          >
                            Jadikan Default
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="rounded-full border border-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10"
                          >
                            Hapus
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {activeMenu === "password" && (
              <motion.section
                key="password"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Ubah Password</h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <input
                    type="password"
                    value={passwordState.current}
                    onChange={(event) =>
                      setPasswordState({ ...passwordState, current: event.target.value })
                    }
                    placeholder="Password sekarang"
                    className="rounded-2xl border border-cyan-400/10 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                  />
                  <input
                    type="password"
                    value={passwordState.next}
                    onChange={(event) =>
                      setPasswordState({ ...passwordState, next: event.target.value })
                    }
                    placeholder="Password baru"
                    className="rounded-2xl border border-cyan-400/10 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                  />
                  <input
                    type="password"
                    value={passwordState.confirm}
                    onChange={(event) =>
                      setPasswordState({ ...passwordState, confirm: event.target.value })
                    }
                    placeholder="Konfirmasi password"
                    className="rounded-2xl border border-cyan-400/10 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordSave}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400"
                >
                  <Shield className="h-4 w-4" />
                  Simpan Password
                </button>
              </motion.section>
            )}

            {activeMenu === "pesanan" && (
              <motion.section
                key="pesanan"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold text-zinc-50">Pesanan Saya</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 rounded-full border border-cyan-400/15 bg-zinc-950/70 p-2">
                    {orderTabs.map((tab) => {
                      const active = selectedTab === tab;

                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSelectedTab(tab)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-cyan-500 text-zinc-950"
                              : "text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-cyan-400/15 bg-zinc-950/70 p-6 text-sm text-zinc-400">
                      Tidak ada pesanan pada tab ini.
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const active = order.id === selectedOrderId;

                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${
                            active
                              ? "border-cyan-400/25 bg-cyan-500/10"
                              : "border-cyan-400/10 bg-zinc-950/70 hover:border-cyan-400/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {order.id}
                              </div>
                              <h3 className="mt-1 text-base font-semibold text-zinc-50">
                                {order.productName}
                              </h3>
                              <p className="mt-1 text-sm text-zinc-300">
                                {order.quantityKg.toFixed(2)} kg • {order.logisticsLabel}
                              </p>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.section>
            )}

            {activeMenu === "notifikasi" && (
              <motion.section
                key="notifikasi"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Notifikasi</h2>
                </div>

                <div className="mt-5 space-y-3">
                  {activeNotifications.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-3xl border p-4 ${toneClass(item.tone)}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className="text-xs opacity-70">{item.time}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed opacity-90">{item.description}</p>
                    </article>
                  ))}
                </div>
              </motion.section>
            )}

            {activeMenu === "voucher" && (
              <motion.section
                key="voucher"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={motionSection}
                className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
              >
                <div className="flex items-center gap-2">
                  <TicketPercent className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-semibold text-zinc-50">Voucher Saya</h2>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4">
                    <p className="text-sm font-semibold text-zinc-50">Tambah Voucher</p>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={voucherCode}
                        onChange={(event) => setVoucherCode(event.target.value)}
                        placeholder="Masukkan kode voucher"
                        className="w-full rounded-2xl border border-cyan-400/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveVoucher}
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400"
                      >
                        <Plus className="h-4 w-4" />
                        Simpan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {savedVouchers.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-cyan-400/15 bg-zinc-950/70 p-6 text-sm text-zinc-400">
                        Belum ada voucher tersimpan.
                      </div>
                    ) : (
                      savedVouchers.map((voucher) => (
                        <article
                          key={voucher}
                          className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-emerald-100">{voucher}</p>
                            <span className="rounded-full border border-emerald-400/20 px-3 py-1 text-xs text-emerald-100">
                              Aktif
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-emerald-100/80">
                            Simpan voucher untuk promo checkout berikutnya.
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28, delay: 0.05 } }}
            className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-zinc-50">Tracking Maps Real-time</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trackingActive ? "border border-cyan-400/25 bg-cyan-500/10 text-cyan-100" : "border border-zinc-700 bg-zinc-900 text-zinc-300"}`}>
                {trackingActive ? "Aktif" : "Menunggu pengiriman"}
              </span>
            </div>

            {trackingActive ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#0B1220] p-5">
                  <div className="absolute inset-0 opacity-60">
                    <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute right-10 bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                  </div>

                  <div className="relative h-90 overflow-hidden rounded-3xl border border-cyan-400/15 bg-zinc-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),rgba(15,23,42,0.9))]" />
                    <div className="absolute inset-x-8 top-16 h-px bg-cyan-400/20" />
                    <div className="absolute inset-x-8 top-32 h-px bg-cyan-400/20" />
                    <div className="absolute inset-x-8 top-48 h-px bg-cyan-400/20" />
                    <div className="absolute inset-y-8 left-1/2 w-px bg-cyan-400/20" />

                    <div className="absolute left-8 top-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                      Petani {selectedOrder?.farmerName ?? "Mitra InfoTani"}
                    </div>
                    <div className="absolute right-8 bottom-8 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                      Customer
                    </div>

                    <motion.div
                      className="absolute left-12 top-16 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                      animate={{ x: [0, 110, 210, 300, 360], y: [0, 20, 36, 52, 68] }}
                      transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    >
                      <Truck className="h-5 w-5" />
                    </motion.div>

                    <motion.div
                      className="absolute left-12 top-16 h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]"
                      animate={{ x: [0, 110, 210, 300, 360], y: [0, 20, 36, 52, 68] }}
                      transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    />

                    <div className="absolute right-10 bottom-12 h-5 w-5 rounded-full border border-cyan-300/30 bg-cyan-400/80 shadow-[0_0_18px_rgba(34,211,238,0.65)]" />

                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-cyan-400/15 bg-black/25 px-4 py-3 text-sm text-zinc-200 backdrop-blur">
                      Truk bergerak dari lokasi petani ke alamat customer secara live.
                    </div>
                  </div>

                  {sharedTracking && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-400/15 bg-zinc-900">
                      <iframe
                        title="Customer Shared Tracking"
                        src={`https://maps.google.com/maps?q=${sharedTracking.latitude},${sharedTracking.longitude}&z=13&output=embed`}
                        className="h-56 w-full"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-3xl border border-cyan-400/15 bg-zinc-950/70 p-4 text-sm text-zinc-200">
                  <div>
                    <p className="text-zinc-400">Pesanan aktif</p>
                    <p className="mt-1 text-base font-semibold text-zinc-50">{selectedOrder?.productName ?? "Pesanan Aktif"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Armada</p>
                    <p className="mt-1 text-base font-semibold text-zinc-50">{sharedTracking?.vehicleLabel ?? selectedOrder?.logisticsLabel ?? "Armada PT InfoTani"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Posisi sekarang</p>
                    <p className="mt-1 text-base font-semibold text-cyan-200">{sharedTracking?.truckLocationLabel ?? selectedOrder?.truckLocation ?? "Sedang diperbarui"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Progress pengiriman</p>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full origin-left rounded-full bg-linear-to-r from-cyan-400 to-emerald-400"
                        initial={false}
                        animate={{ scaleX: createDeliveryProgress(selectedOrder?.status ?? "Diproses") / 100 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400">Tujuan</p>
                    <p className="mt-1 text-zinc-50">{selectedOrder?.destination ?? "Alamat customer"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-cyan-400/15 bg-zinc-950/70 p-6 text-sm text-zinc-400">
                Tracking Maps aktif otomatis jika ada pesanan dengan status Dikirim.
              </div>
            )}
          </motion.section>
        </div>
      </section>
    </main>
  );
}
