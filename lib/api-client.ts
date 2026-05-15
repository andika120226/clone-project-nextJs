/**
 * API Client Wrapper
 * Handles authentication, request/response serialization, and error handling
 */

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

/**
 * Get stored JWT token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Store JWT token in localStorage
 */
export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Clear stored JWT token
 */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/**
 * Main API client function
 * Handles authentication, serialization, and error handling
 */
export async function apiCall<T = Record<string, unknown>>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // Prepare headers
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  // Add authorization token if available
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        ok: false,
        error: (data.error as string) || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data: (data.data as T) || (data as T),
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

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: <T = Record<string, unknown>>(endpoint: string, options?: ApiRequestOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = Record<string, unknown>>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: ApiRequestOptions
  ) => apiCall<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: <T = Record<string, unknown>>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: ApiRequestOptions
  ) => apiCall<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T = Record<string, unknown>>(endpoint: string, options?: ApiRequestOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};
