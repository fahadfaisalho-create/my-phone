export type StoreProviderType = 'company' | 'individual';

export interface StoreListItem {
  id: string;
  name: string;
  logoUrl: string | null;
  providerType: StoreProviderType;
  servicesCount: number;
  productsCount: number;
  reviewsCount: number;
  avgRating: number | null;
  available: boolean;
}

export type DeviceSupport = 'all' | 'apple' | 'samsung';

export type VisitType = 'in_store' | 'home_visit';

export interface StoreService {
  id: string;
  name: string;
  deviceSupport: DeviceSupport;
  laborPrice: string;
  linkedProductId: string | null;
  supportsInStore: boolean;
  supportsHomeVisit: boolean;
  homeVisitFee: string | null;
}

export interface StoreProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  description: string | null;
  price: string;
  quantity: number;
  // فرع محدد (مخزون منفصل خاص بهذا الفرع) — أو فارغ = مشترك بين كل فروع المحل
  branchId: string | null;
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

export interface TechnicianCertificate {
  id: string;
  title: string;
  fileUrl: string | null;
}

export interface Technician {
  id: string;
  name: string;
  nationality: string;
  experienceYears: number | null;
  photoUrl: string | null;
  freelanceLicenseNo: string | null;
  freelanceLicenseFileUrl: string | null;
  certificates: TechnicianCertificate[];
}

export interface StoreDetail {
  id: string;
  name: string;
  logoUrl: string | null;
  providerType: StoreProviderType;
  idVerified: boolean;
  branches: StoreBranch[];
  services: StoreService[];
  products: StoreProduct[];
  reviews: StoreReview[];
  technicians: Technician[];
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
export const DEVICE_LABEL_EN: Record<DeviceSupport, string> = {
  all: 'All devices',
  apple: 'Apple only',
  samsung: 'Samsung only',
};
