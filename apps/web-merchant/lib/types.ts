export type StoreStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type SubscriptionPlan = 'monthly' | 'six_months' | 'yearly';
export type DeviceSupport = 'all' | 'apple' | 'samsung';
export type StoreProviderType = 'company' | 'individual';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  price: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  paidAt: string | null;
}

export interface Store {
  id: string;
  ownerUserId: string;
  name: string;
  logoUrl: string | null;
  providerType: StoreProviderType;
  commercialRegisterNo: string | null;
  nationalId: string | null;
  taxNo: string | null;
  iban: string;
  crFileUrl: string | null;
  bankCertificateFileUrl: string;
  status: StoreStatus;
  rejectionReason: string | null;
  createdAt: string;
  subscriptions?: Subscription[];
  supportsDelivery: boolean;
  deliveryFee: string | null;
}

export interface Branch {
  id: string;
  storeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  description: string | null;
  price: string;
  quantity: number;
  createdAt: string;
  // فرع محدد (مخزون منفصل خاص بهذا الفرع) — أو فارغ = مشترك بين كل فروع المحل
  branchId: string | null;
  branch?: { id: string; name: string } | null;
}

export interface Service {
  id: string;
  storeId: string;
  name: string;
  deviceSupport: DeviceSupport;
  laborPrice: string;
  linkedProductId: string | null;
  supportsInStore: boolean;
  supportsHomeVisit: boolean;
  homeVisitFee: string | null;
}

export interface TechnicianCertificate {
  id: string;
  technicianId: string;
  title: string;
  fileUrl: string | null;
  createdAt: string;
}

export interface Technician {
  id: string;
  storeId: string;
  name: string;
  nationality: string;
  experienceYears: number | null;
  photoUrl: string | null;
  freelanceLicenseNo: string | null;
  freelanceLicenseFileUrl: string | null;
  createdAt: string;
  certificates: TechnicianCertificate[];
}

export interface Chat {
  id: string;
  consumerId: string;
  storeId: string;
  createdAt: string;
  consumer?: { name: string; phone: string | null };
  messages?: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  senderType: 'merchant' | 'consumer';
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: 'شهر',
  six_months: '6 أشهر',
  yearly: 'سنة',
};
export const PLAN_PRICE: Record<SubscriptionPlan, string> = {
  monthly: '300 ﷼',
  six_months: '1,200 ﷼',
  yearly: '2,000 ﷼',
};

export const DEVICE_LABEL: Record<DeviceSupport, string> = {
  all: 'جميع الأجهزة',
  apple: 'أبل فقط',
  samsung: 'سامسونج فقط',
};

export const SERVICE_CATALOG = [
  'صيانة شاشة',
  'صيانة سماعات',
  'صيانة بطاريات',
  'صيانة شحن',
  'صيانة كاميرا',
];
