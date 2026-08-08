-- الإدمن يؤكد استلام دفع الاشتراك يدوياً لحد ربط بوابة دفع فعلية
ALTER TABLE "subscriptions" ADD COLUMN "paid_at" TIMESTAMP(3);
