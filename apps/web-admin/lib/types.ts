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
  vatAmount: string | null;
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
  // تُعبّى فقط بعد موافقة الإدمن (approve)
  verifiedAt: string | null;
  // فقط لمزوّد فرد مستقل (providerType=individual)
  freelanceLicenseExpiry: string | null;
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
export const ORDER_STATUS_LABEL_EN: Record<OrderStatus, string> = {
  pending: 'Awaiting processing',
  processing: 'Being prepared',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export type ZatcaStatus =
  | 'not_sent'
  | 'pending'
  | 'accepted'
  | 'accepted_with_warnings'
  | 'rejected'
  | 'failed';

export interface TaxInvoice {
  id: string;
  invoiceNo: string;
  icv: number;
  subtotal: string;
  vatAmount: string;
  total: string;
  status: ZatcaStatus;
  lastError: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  store: { name: string };
  order: { id: string; paidAt: string | null; consumer: { name: string; phone: string | null } };
}

export const ZATCA_STATUS_LABEL: Record<ZatcaStatus, string> = {
  not_sent: 'لم تُرسل بعد',
  pending: 'قيد الإرسال',
  accepted: 'مقبولة',
  accepted_with_warnings: 'مقبولة مع تحذيرات',
  rejected: 'مرفوضة',
  failed: 'فشل الإرسال',
};
export const ZATCA_STATUS_LABEL_EN: Record<ZatcaStatus, string> = {
  not_sent: 'Not sent yet',
  pending: 'Sending…',
  accepted: 'Accepted',
  accepted_with_warnings: 'Accepted with warnings',
  rejected: 'Rejected',
  failed: 'Failed to send',
};
export const ZATCA_STATUS_BADGE: Record<ZatcaStatus, string> = {
  not_sent: 'b-pending',
  pending: 'b-pending',
  accepted: 'b-active',
  accepted_with_warnings: 'b-active',
  rejected: 'b-rejected',
  failed: 'b-rejected',
};

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

export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponScope = 'orders' | 'subscriptions' | 'both';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  percentage: string | null;
  fixedAmount: string | null;
  maxDiscount: string | null;
  storeId: string | null;
  scope: CouponScope;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
}

export const COUPON_SCOPE_LABEL: Record<CouponScope, string> = {
  orders: 'طلبات الشراء',
  subscriptions: 'اشتراكات المحلات',
  both: 'طلبات الشراء + الاشتراكات',
};
export const COUPON_SCOPE_LABEL_EN: Record<CouponScope, string> = {
  orders: 'Purchase orders',
  subscriptions: 'Store subscriptions',
  both: 'Purchase orders + subscriptions',
};
