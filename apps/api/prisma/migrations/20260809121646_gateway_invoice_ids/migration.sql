-- ربط اشتراكات المحلات وطلبات الشراء بفاتورة بوابة الدفع الفعلية (Moyasar)
ALTER TABLE "subscriptions" ADD COLUMN "gateway_invoice_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "gateway_invoice_id" TEXT;
