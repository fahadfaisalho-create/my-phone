-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('in_store', 'home_visit');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "supports_in_store" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "supports_home_visit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "home_visit_fee" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "visit_type" "VisitType" NOT NULL DEFAULT 'in_store',
ADD COLUMN     "customer_address" TEXT;
