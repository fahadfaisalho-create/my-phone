import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN || 'http://localhost:3000';
export const API_BASE = `${API_ORIGIN}/api`;

const TOKEN_KEY = 'consumer_token';
const USER_KEY = 'consumer_user';

export interface ConsumerUser {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setSession(token: string, user: ConsumerUser) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<ConsumerUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${API_ORIGIN}${path}`;
}
