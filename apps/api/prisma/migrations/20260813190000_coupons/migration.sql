-- نوع خصم الكوبون
CREATE TYPE "CouponDiscountType" AS ENUM ('percentage', 'fixed');

-- كوبونات الخصم — عامة (storeId فارغ، أنشأها الإدمن) أو مقفلة على متجر واحد (أنشأها التاجر)
CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discount_type" "CouponDiscountType" NOT NULL,
  "percentage" DECIMAL(5,2),
  "fixed_amount" DECIMAL(10,2),
  "max_discount" DECIMAL(10,2),
  "store_id" TEXT,
  "starts_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "usage_limit" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ربط الطلب بالكوبون المستخدم + قيمة الخصم الفعلية وقت الطلب
ALTER TABLE "orders" ADD COLUMN "coupon_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(10,2);
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey"
  FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
