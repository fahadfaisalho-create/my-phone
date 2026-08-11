-- شركة الشحن المختارة عند التوصيل
CREATE TYPE "CourierProvider" AS ENUM ('aramex', 'fedex');

-- تواريخ الطلب/الدفع (تاريخ الشراء وتاريخ إصدار الفاتورة)
ALTER TABLE "orders" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "orders" ADD COLUMN "paid_at" TIMESTAMP(3);

-- نسخة رسوم التوصيل وقت الطلب + شركة الشحن
ALTER TABLE "orders" ADD COLUMN "delivery_fee" DECIMAL(10,2);
ALTER TABLE "orders" ADD COLUMN "courier_provider" "CourierProvider";

-- الطلبات المدفوعة مسبقاً (لو وجدت) تُعتبر مدفوعة منذ إنشائها لغرض تاريخ الفاتورة
UPDATE "orders" SET "paid_at" = "created_at" WHERE "payment_status" = 'paid';
