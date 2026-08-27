-- CreateEnum
CREATE TYPE "ZatcaStatus" AS ENUM ('not_sent', 'pending', 'accepted', 'accepted_with_warnings', 'rejected', 'failed');

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "next_invoice_icv" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "platform_cr_no" TEXT,
ADD COLUMN     "platform_legal_name" TEXT,
ADD COLUMN     "platform_vat_no" TEXT,
ALTER COLUMN "id" SET DEFAULT 'default';

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "freelance_license_expiry" TIMESTAMP(3),
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tax_invoices" (
    "id" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "icv" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vat_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "previous_invoice_hash" TEXT,
    "invoice_hash" TEXT,
    "zatca_uuid" TEXT,
    "zatca_qr_data" TEXT,
    "status" "ZatcaStatus" NOT NULL DEFAULT 'not_sent',
    "last_error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_invoice_no_key" ON "tax_invoices"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_icv_key" ON "tax_invoices"("icv");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_order_id_key" ON "tax_invoices"("order_id");

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
