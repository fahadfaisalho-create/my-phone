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
  couponId: string | null;
  discountAmount: string | null;
  vatAmount: string | null;
}

export type CouponDiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  percentage: string | null;
  fixedAmount: string | null;
  maxDiscount: string | null;
  storeId: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
}

export interface StoreAd {
  id: string;
  storeId: string;
  days: number;
  dailyRate: string;
  totalPrice: string;
  paidAt: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
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
  // توصيل داخلي بمناديب المحل: نطاق دائري (مركز + نصف قطر بالكم) وسعره
  supportsAgentDelivery: boolean;
  agentDeliveryFee: string | null;
  agentZoneLat: number | null;
  agentZoneLng: number | null;
  agentZoneRadiusKm: number | null;
}

export interface DeliveryAgent {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  active: boolean;
  createdAt: string;
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
export const PLAN_LABEL_EN: Record<SubscriptionPlan, string> = {
  monthly: 'Monthly',
  six_months: '6 Months',
  yearly: 'Yearly',
};
// شاملة ضريبة القيمة المضافة (15%) — السعر الأساسي 300 / 1,200 / 2,000 ﷼ + الضريبة
export const PLAN_PRICE: Record<SubscriptionPlan, string> = {
  monthly: '345 ﷼ (شامل الضريبة)',
  six_months: '1,380 ﷼ (شامل الضريبة)',
  yearly: '2,300 ﷼ (شامل الضريبة)',
};
export const PLAN_PRICE_EN: Record<SubscriptionPlan, string> = {
  monthly: 'SAR 345 (VAT included)',
  six_months: 'SAR 1,380 (VAT included)',
  yearly: 'SAR 2,300 (VAT included)',
};

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

export const SERVICE_CATALOG = [
  'صيانة شاشة',
  'صيانة سماعات',
  'صيانة بطاريات',
  'صيانة شحن',
  'صيانة كاميرا',
];

// أقسام لوحة التاجر — نفس تبويبات الشريط الجانبي بالضبط، تُستخدم كصلاحيات
// دقيقة للحسابات الفرعية
export type StoreSection =
  | 'branches'
  | 'services'
  | 'products'
  | 'inventory'
  | 'technicians'
  | 'bookings'
  | 'orders'
  | 'taxInvoices'
  | 'coupons'
  | 'ads'
  | 'messages'
  | 'stats'
  | 'support'
  | 'settings';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  permissions: StoreSection[];
  active: boolean;
  attendanceLat: number | null;
  attendanceLng: number | null;
  attendanceRadiusM: number | null;
  createdAt: string;
  user: { phone: string | null; email: string | null };
}

export interface AttendanceRecord {
  id: string;
  checkInAt: string;
  checkInLat: number;
  checkInLng: number;
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  employee: { firstName: string; lastName: string };
}
