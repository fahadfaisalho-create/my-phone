-- CreateEnum
CREATE TYPE "TechnicianStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "freelance_license_no" TEXT;

-- AlterTable
ALTER TABLE "technicians" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "TechnicianStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- الفنيون الموجودون قبل هذا التحديث كانوا يُضافون بلا أي مراجعة إدمن أصلاً
-- (الميزة لم تكن موجودة) — لا داعي لإخفائهم عن صفحات محلاتهم العامة الآن،
-- فنعتبرهم معتمدين تلقائياً؛ فقط الفنيون الجدد بعد هذا التحديث يبدؤون "قيد المراجعة"
UPDATE "technicians" SET "status" = 'approved', "verified_at" = "created_at";
