export type StoreStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type SubscriptionPlan = 'monthly' | 'six_months' | 'yearly';
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

export interface StoreRequest {
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
  owner: { name: string; email: string | null; phone: string | null };
  subscriptions: Subscription[];
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface AdminOrder {
  id: string;
  total: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  store: { name: string };
  consumer: { name: string; phone: string | null };
  items: { qty: number; product: { name: string } }[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'بانتظار المعالجة',
  processing: 'جارٍ التجهيز',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: 'شهر',
  six_months: '6 أشهر',
  yearly: 'سنة',
};
