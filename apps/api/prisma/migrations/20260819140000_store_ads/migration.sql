-- إعدادات عامة للمنصة (صف واحد فقط)
CREATE TABLE "platform_settings" (
  "id" TEXT NOT NULL,
  "ad_daily_rate" DECIMAL(10,2) NOT NULL DEFAULT 50,
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "platform_settings" ("id", "ad_daily_rate") VALUES ('default', 50);

-- إعلانات المتاجر المميزة (دفع ذاتي محاكى)
CREATE TABLE "store_ads" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "daily_rate" DECIMAL(10,2) NOT NULL,
  "total_price" DECIMAL(10,2) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "starts_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_ads_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "store_ads" ADD CONSTRAINT "store_ads_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
