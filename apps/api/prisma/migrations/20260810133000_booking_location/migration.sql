-- إحداثيات دقيقة (اختيارية) لموقع الزيارة المنزلية
ALTER TABLE "bookings" ADD COLUMN "customer_lat" DECIMAL(10,7);
ALTER TABLE "bookings" ADD COLUMN "customer_lng" DECIMAL(10,7);
