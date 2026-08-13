-- نوع مزوّد الخدمة: محل/شركة أو فرد مستقل يقدّم الصيانة بنفسه
CREATE TYPE "StoreProviderType" AS ENUM ('company', 'individual');

ALTER TABLE "stores" ADD COLUMN "provider_type" "StoreProviderType" NOT NULL DEFAULT 'company';
ALTER TABLE "stores" ADD COLUMN "national_id" TEXT;

-- السجل التجاري وملفه إلزاميان للمحلات فقط — يبقيان فارغين للأفراد المستقلين
ALTER TABLE "stores" ALTER COLUMN "commercial_register_no" DROP NOT NULL;
ALTER TABLE "stores" ALTER COLUMN "cr_file_url" DROP NOT NULL;
