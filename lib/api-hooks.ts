'use client';

/**
 * Custom React Hooks for API Operations
 * Handles authentication, profile, products, orders, and tracking
 */

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T = Record<string, unknown>> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

async function apiCall<T = Record<string, unknown>>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data: data?.data || data,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      error: errorMessage,
      status: 0,
    };
  }
}

const api = {
  get: <T = Record<string, unknown>>(endpoint: string, options?: ApiRequestOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = Record<string, unknown>>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiCall<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T = Record<string, unknown>>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiCall<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = Record<string, unknown>>(endpoint: string, options?: ApiRequestOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'FARMER';
  phone?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  farmerId: string;
  name: string;
  description?: string;
  pricePerKg: number;
  stockKg: number;
  imageUrl?: string;
  isActive: boolean;
  farmer?: {
    id: string;
    name: string;
    image?: string;
    gender?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  city: string;
  province: string;
  isMain: boolean;
  createdAt?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt?: string;
}

export interface LogisticsVehicle {
  id: string;
  name: string;
  vehicleType: string;
  capacityTon: number;
  price: number;
  isActive: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantityKg: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  trackingId: string;
  customerId: string;
  farmerId: string;
  logisticsVehicleId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  logisticsCost: number;
  total: number;
  currentLat?: number;
  currentLng?: number;
  estimatedArrival?: string;
  notes?: string;
  items?: OrderItem[];
  customer?: User;
  farmer?: User;
  logisticsVehicle?: LogisticsVehicle;
  trackingPoints?: TrackingPoint[];
  createdAt?: string;
}

export interface TrackingPoint {
  latitude: number;
  longitude: number;
  note?: string;
  recordedAt: string;
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'FARMER';
  phone?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
  image?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    if (getStoredToken()) {
      setIsLoggedIn(true);
    }
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/signup', payload);
      if (res.ok && res.data) {
        setStoredToken(res.data.token);
        setUser(res.data.user);
        setIsLoggedIn(true);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Signup failed');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', payload);
      if (res.ok && res.data) {
        setStoredToken(res.data.token);
        setUser(res.data.user);
        setIsLoggedIn(true);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Login failed');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return { user, loading, error, isLoggedIn, signup, login, logout };
}

// ============================================================================
// PROFILE HOOKS
// ============================================================================

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<User>('/api/profile');
      if (res.ok && res.data) {
        setUser(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch profile');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<User>('/api/profile', updates);
      if (res.ok && res.data) {
        setUser(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to update profile');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, fetchProfile, updateProfile };
}

// ============================================================================
// ADDRESS HOOKS
// ============================================================================

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Address[]>('/api/profile/addresses');
      if (res.ok && res.data) {
        setAddresses(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch addresses');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createAddress = useCallback(async (address: Omit<Address, 'id' | 'userId' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<Address>('/api/profile/addresses', address);
      if (res.ok && res.data) {
        setAddresses((prev) => [...prev, res.data!]);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to create address');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (id: string, updates: Partial<Address>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<Address>(`/api/profile/addresses/${id}`, updates);
      if (res.ok && res.data) {
        setAddresses((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to update address');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/profile/addresses/${id}`);
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        return { ok: true };
      } else {
        setError(res.error || 'Failed to delete address');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { addresses, loading, error, fetchAddresses, createAddress, updateAddress, deleteAddress };
}

// ============================================================================
// BANK ACCOUNT HOOKS
// ============================================================================

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<BankAccount[]>('/api/profile/banks');
      if (res.ok && res.data) {
        setAccounts(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch bank accounts');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createBankAccount = useCallback(async (account: Omit<BankAccount, 'id' | 'userId' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<BankAccount>('/api/profile/banks', account);
      if (res.ok && res.data) {
        setAccounts((prev) => [...prev, res.data!]);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to create bank account');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBankAccount = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/profile/banks/${id}`);
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        return { ok: true };
      } else {
        setError(res.error || 'Failed to delete bank account');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { accounts, loading, error, fetchBankAccounts, createBankAccount, deleteBankAccount };
}

// ============================================================================
// PRODUCT HOOKS
// ============================================================================

export function useProducts(filters?: { farmerId?: string; search?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Product[]>('/api/products', { params: filters });
      if (res.ok && res.data) {
        setProducts(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch products');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'farmerId' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<Product>('/api/products', product);
      if (res.ok && res.data) {
        setProducts((prev) => [res.data!, ...prev]);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to create product');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProductStock = useCallback(async (productId: string, stockKg: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<Product>(`/api/farmer/products/${productId}/stock`, { stockKg });
      if (res.ok && res.data) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res.data! : p)));
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to update product stock');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, fetchProducts, createProduct, updateProductStock };
}

// ============================================================================
// LOGISTICS HOOKS
// ============================================================================

export function useLogistics() {
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LogisticsVehicle[]>('/api/logistics');
      if (res.ok && res.data) {
        setVehicles(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch logistics vehicles');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { vehicles, loading, error, fetchVehicles };
}

// ============================================================================
// ORDER HOOKS
// ============================================================================

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Order[]>('/api/orders');
      if (res.ok && res.data) {
        setOrders(res.data);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch orders');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async (orderData: {
      items: Array<{ productId: string; quantityKg: number }>;
      addressId: string;
      customerBankAccountId: string;
      logisticsVehicleId?: string;
      estimatedArrival?: string;
      notes?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post<{ order: Order; items: OrderItem[] }>('/api/orders', orderData);
        if (res.ok && res.data) {
          setOrders((prev) => [res.data!.order, ...prev]);
          return { ok: true, data: res.data };
        } else {
          setError(res.error || 'Failed to create order');
          return { ok: false, error: res.error };
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { orders, loading, error, fetchOrders, createOrder };
}

// ============================================================================
// TRACKING HOOKS
// ============================================================================

export function useTracking(trackingId?: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Order>(`/api/tracking/${id}`);
      if (res.ok && res.data) {
        setOrder(res.data);
        setTrackingPoints(res.data.trackingPoints || []);
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch tracking data');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, updates: { status?: string; currentLat?: number; currentLng?: number; note?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.patch<Order>(`/api/tracking/${id}`, updates);
        if (res.ok && res.data) {
          setOrder(res.data);
          if (updates.currentLat !== undefined && updates.currentLng !== undefined && updates.note) {
            setTrackingPoints((prev) => [
              {
                latitude: updates.currentLat!,
                longitude: updates.currentLng!,
                note: updates.note,
                recordedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
          return { ok: true, data: res.data };
        } else {
          setError(res.error || 'Failed to update order status');
          return { ok: false, error: res.error };
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-fetch when trackingId is provided
  useEffect(() => {
    if (trackingId) {
      fetchTracking(trackingId);
    }
  }, [trackingId, fetchTracking]);

  return { order, trackingPoints, loading, error, fetchTracking, updateOrderStatus };
}

// ============================================================================
// PAYMENT HOOKS
// ============================================================================

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; url: string; orderId: string }>(
        `/api/orders/${orderId}/payment`,
        {}
      );
      if (res.ok && res.data) {
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to initiate payment');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, initiatePayment };
}

// ============================================================================
// PRODUCT MANAGEMENT HOOKS
// ============================================================================

export function useProductManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (productId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
        },
      });

      const json = await res.json();

      if (res.ok && json.ok) {
        return { ok: true, data: json.data };
      } else {
        const err = json.error || 'Failed to upload image';
        setError(err);
        return { ok: false, error: err };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePricing = useCallback(async (productId: string, pricePerKg: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/api/products/${productId}/pricing`, { pricePerKg });
      if (res.ok && res.data) {
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to update pricing');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getImages = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/products/${productId}/images`);
      if (res.ok && res.data) {
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch images');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, uploadImage, updatePricing, getImages };
}

// ============================================================================
// ADMIN ORDERS HOOKS
// ============================================================================

interface AdminOrder {
  id: string;
  trackingId: string;
  status: string;
  total: number;
  subtotal: number;
  logisticsCost: number;
  discountPercentage: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items?: Array<{
    id: string;
    productId: string;
    quantityKg: number;
    unitPrice: number;
    subtotal: number;
    product?: {
      id: string;
      name: string;
      pricePerKg: number;
    };
  }>;
  payment?: {
    id: string;
    status: string;
    amount: number;
  };
  messages?: Array<{
    id: string;
    sender: string;
    message: string;
    createdAt: string;
  }>;
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchOrders = useCallback(async (status?: string, page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (status) params.append('status', status);

      const res = await api.get(`/api/admin/orders?${params.toString()}`);
      if (res.ok && res.data) {
        const payload = res.data as { data: AdminOrder[]; pagination: typeof pagination };
        setOrders(payload.data || []);
        setPagination(payload.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch orders');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: string, message?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/api/admin/orders/${orderId}`, { status, message });
      if (res.ok && res.data) {
        // Refresh orders
        await fetchOrders();
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to update order');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  const getOrderDetail = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      if (res.ok && res.data) {
        return { ok: true, data: res.data };
      } else {
        setError(res.error || 'Failed to fetch order detail');
        return { ok: false, error: res.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, pagination, loading, error, fetchOrders, updateOrderStatus, getOrderDetail };
}
