export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3000';
export const API_BASE = `${API_ORIGIN}/api`;
// رابط تطبيق المستهلك (ويب) — يُستخدم لبناء رابط مشاركة صفحة المحل
export const CONSUMER_APP_ORIGIN = process.env.NEXT_PUBLIC_CONSUMER_APP_ORIGIN || 'http://localhost:3003';

const TOKEN_KEY = 'merchant_token';
const USER_KEY = 'merchant_user';

export interface MerchantUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: MerchantUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): MerchantUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = 'حدث خطأ غير متوقع';
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message.join('، ') : data.message || message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// يحوّل مسار ملف نسبي (مثل /uploads/products/x.jpg) لرابط كامل على الـ API
export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${API_ORIGIN}${path}`;
}
