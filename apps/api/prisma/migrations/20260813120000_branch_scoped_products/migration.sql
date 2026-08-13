-- منتج يقدر يرتبط بفرع محدد (مخزون منفصل) أو يبقى بدون فرع (مشترك بين كل الفروع)
ALTER TABLE "products" ADD COLUMN "branch_id" TEXT;
ALTER TABLE "products" ADD CONSTRAINT "products_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- الفرع الذي اختاره المستهلك للتسوق منه عند إنشاء الطلب (مرجعي، اختياري)
ALTER TABLE "orders" ADD COLUMN "branch_id" TEXT;
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
