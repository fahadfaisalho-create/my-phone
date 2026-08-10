-- طريقة استلام الطلب: من الفرع أو توصيل
CREATE TYPE "DeliveryType" AS ENUM ('pickup', 'delivery');

-- إعدادات التوصيل بالمحل (يفعّلها التاجر ويحدد رسومها)
ALTER TABLE "stores" ADD COLUMN "supports_delivery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN "delivery_fee" DECIMAL(10,2);

-- بيانات التوصيل بالطلب
ALTER TABLE "orders" ADD COLUMN "delivery_type" "DeliveryType" NOT NULL DEFAULT 'pickup';
ALTER TABLE "orders" ADD COLUMN "delivery_address" TEXT;
ALTER TABLE "orders" ADD COLUMN "delivery_lat" DECIMAL(10,7);
ALTER TABLE "orders" ADD COLUMN "delivery_lng" DECIMAL(10,7);
