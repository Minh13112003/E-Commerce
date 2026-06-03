-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "max" INTEGER,
ADD COLUMN     "value" INTEGER NOT NULL DEFAULT 0;
