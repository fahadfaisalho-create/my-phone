-- CreateEnum
CREATE TYPE "StoreSection" AS ENUM ('branches', 'services', 'products', 'inventory', 'technicians', 'bookings', 'orders', 'taxInvoices', 'coupons', 'ads', 'messages', 'stats', 'support', 'settings');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'employee';

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "national_id" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "permissions" "StoreSection"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "attendance_lat" DOUBLE PRECISION,
    "attendance_lng" DOUBLE PRECISION,
    "attendance_radius_m" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "check_in_at" TIMESTAMP(3) NOT NULL,
    "check_in_lat" DOUBLE PRECISION NOT NULL,
    "check_in_lng" DOUBLE PRECISION NOT NULL,
    "check_out_at" TIMESTAMP(3),
    "check_out_lat" DOUBLE PRECISION,
    "check_out_lng" DOUBLE PRECISION,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_user_id_key" ON "employee_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
