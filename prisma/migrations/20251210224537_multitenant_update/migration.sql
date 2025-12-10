/* -----------------------------------------------
   1) Yeni Company tablosu oluştur
----------------------------------------------- */
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

/* -----------------------------------------------
   2) Vatan Denizcilik şirketini ekle (ID = 1)
----------------------------------------------- */
INSERT INTO "Company" ("id", "name", "logoUrl", "faviconUrl", "isActive", "createdAt", "updatedAt")
VALUES (1, 'Vatan Denizcilik', NULL, NULL, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

/* -----------------------------------------------
   3) Tablolara companyId kolonu ekle (GEÇİCİ DEFAULT 1)
----------------------------------------------- */
ALTER TABLE "Assignment"     ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AttendanceLog"  ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "NFCCard"        ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Personnel"      ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Shift"          ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Station"        ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 1;

/* -----------------------------------------------
   4) Mevcut tüm satırları Vatan Denizcilik'e bağla
----------------------------------------------- */
UPDATE "Assignment"     SET "companyId" = 1;
UPDATE "AttendanceLog"  SET "companyId" = 1;
UPDATE "NFCCard"        SET "companyId" = 1;
UPDATE "Personnel"      SET "companyId" = 1;
UPDATE "Shift"          SET "companyId" = 1;
UPDATE "Station"        SET "companyId" = 1;

/* -----------------------------------------------
   5) Default değerleri kaldır
----------------------------------------------- */
ALTER TABLE "Assignment"     ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "AttendanceLog"  ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "NFCCard"        ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "Personnel"      ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "Shift"          ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "Station"        ALTER COLUMN "companyId" DROP DEFAULT;

/* -----------------------------------------------
   6) User tablosuna companyId ekle (NULL olabilir)
----------------------------------------------- */
ALTER TABLE "User" ADD COLUMN "companyId" INTEGER;

/* -----------------------------------------------
   7) SUPERADMIN rolünü enum'a ekle
----------------------------------------------- */
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

/* -----------------------------------------------
   8) Foreign key bağlantıları ekle
----------------------------------------------- */
ALTER TABLE "User"
    ADD CONSTRAINT "User_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Personnel"
    ADD CONSTRAINT "Personnel_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NFCCard"
    ADD CONSTRAINT "NFCCard_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Station"
    ADD CONSTRAINT "Station_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Shift"
    ADD CONSTRAINT "Shift_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Assignment"
    ADD CONSTRAINT "Assignment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AttendanceLog"
    ADD CONSTRAINT "AttendanceLog_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
