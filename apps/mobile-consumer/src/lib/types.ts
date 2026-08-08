export interface StoreListItem {
  id: string;
  name: string;
  logoUrl: string | null;
  servicesCount: number;
  productsCount: number;
  reviewsCount: number;
  avgRating: number | null;
  available: boolean;
}

export type DeviceSupport = 'all' | 'apple' | 'samsung';

export interface StoreService {
  id: string;
  name: string;
  deviceSupport: DeviceSupport;
  laborPrice: string;
  linkedProductId: string | null;
}

export interface StoreProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  description: string | null;
  price: string;
  quantity: number;
}

export interface StoreBranch {
  id: string;
  name: string;
  address: string | null;
}

export interface StoreReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface StoreDetail {
  id: string;
  name: string;
  logoUrl: string | null;
  branches: StoreBranch[];
  services: StoreService[];
  products: StoreProduct[];
  reviews: StoreReview[];
  avgRating: number | null;
  reviewsCount: number;
  available: boolean;
}

export interface ChatListItem {
  id: string;
  storeId: string;
  store: { name: string; logoUrl: string | null };
  messages: { id: string; text: string | null; senderType: 'consumer' | 'merchant'; createdAt: string }[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderType: 'consumer' | 'merchant';
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export const DEVICE_LABEL: Record<DeviceSupport, string> = {
  all: 'جميع الأجهزة',
  apple: 'أبل فقط',
  samsung: 'سامسونج فقط',
};
