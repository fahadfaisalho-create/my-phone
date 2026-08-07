import { ForbiddenException } from '@nestjs/common';

interface SubscriptionLike {
  status: string;
  endDate: Date;
}

// حسب القاعدة: عند انتهاء الاشتراك دون تجديد، المحل يبقى ظاهراً بعلامة "غير متاحة الآن"
// وتُعطَّل أزرار الشات/الحجز/الشراء عليه تلقائياً.
export function isStoreAvailable(
  storeStatus: string,
  latestSubscription: SubscriptionLike | null,
): boolean {
  if (storeStatus !== 'active') return false;
  if (!latestSubscription) return false;
  if (latestSubscription.status !== 'active') return false;
  return latestSubscription.endDate.getTime() > Date.now();
}

export function assertStoreAvailable(storeStatus: string, latestSubscription: SubscriptionLike | null) {
  if (!isStoreAvailable(storeStatus, latestSubscription)) {
    throw new ForbiddenException('هذا المحل غير متاح حالياً (الاشتراك منتهٍ)');
  }
}
