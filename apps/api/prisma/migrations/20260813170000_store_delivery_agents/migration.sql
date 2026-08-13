-- طريقة تنفيذ التوصيل: شركة شحن خارجية أو مندوب المحل
CREATE TYPE "DeliveryMethod" AS ENUM ('courier', 'store_agent');

-- نطاق توصيل المحل بمناديبه الخاصين (نقطة مركزية + نصف قطر) وسعره
ALTER TABLE "stores" ADD COLUMN "supports_agent_delivery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN "agent_delivery_fee" DECIMAL(10,2);
ALTER TABLE "stores" ADD COLUMN "agent_zone_lat" DOUBLE PRECISION;
ALTER TABLE "stores" ADD COLUMN "agent_zone_lng" DOUBLE PRECISION;
ALTER TABLE "stores" ADD COLUMN "agent_zone_radius_km" DOUBLE PRECISION;

-- مناديب التوصيل التابعين للمحل
CREATE TABLE "delivery_agents" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "delivery_agents_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- طريقة تنفيذ التوصيل على الطلب
ALTER TABLE "orders" ADD COLUMN "delivery_method" "DeliveryMethod";
