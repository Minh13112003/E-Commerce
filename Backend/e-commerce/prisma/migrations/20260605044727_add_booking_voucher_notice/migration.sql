-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "notice" TEXT,
ADD COLUMN     "originalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "voucherId" TEXT;

-- CreateIndex
CREATE INDEX "bookings_voucherId_idx" ON "bookings"("voucherId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
