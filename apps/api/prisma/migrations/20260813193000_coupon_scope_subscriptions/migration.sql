-- نطاق تطبيق الكوبون: طلبات، اشتراكات المحلات بالمنصة، أو كلاهما
CREATE TYPE "CouponScope" AS ENUM ('orders', 'subscriptions', 'both');
ALTER TABLE "coupons" ADD COLUMN "scope" "CouponScope" NOT NULL DEFAULT 'orders';

-- خصم كوبون على اشتراك المحل بالمنصة
ALTER TABLE "subscriptions" ADD COLUMN "coupon_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "discount_amount" DECIMAL(10,2);
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_coupon_id_fkey"
  FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
