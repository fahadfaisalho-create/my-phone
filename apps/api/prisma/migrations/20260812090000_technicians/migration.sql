-- فريق الصيانة (موظفو المحل) وشهاداتهم — لبناء مصداقية عند المستهلك
CREATE TABLE "technicians" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "experience_years" INTEGER,
    "photo_url" TEXT,
    "freelance_license_no" TEXT,
    "freelance_license_file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technician_certificates" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_certificates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "technicians" ADD CONSTRAINT "technicians_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technician_certificates" ADD CONSTRAINT "technician_certificates_technician_id_fkey"
  FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
