export type StoreStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type SubscriptionPlan = 'monthly' | 'six_months' | 'yearly';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  price: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
}

export interface StoreRequest {
  id: string;
  ownerUserId: string;
  name: string;
  logoUrl: string | null;
  commercialRegisterNo: string;
  taxNo: string | null;
  iban: string;
  crFileUrl: string;
  bankCertificateFileUrl: string;
  status: StoreStatus;
  rejectionReason: string | null;
  createdAt: string;
  owner: { name: string; email: string | null; phone: string | null };
  subscriptions: Subscription[];
}

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: 'شهر',
  six_months: '6 أشهر',
  yearly: 'سنة',
};
