-- AlterTable
ALTER TABLE "users" ADD COLUMN     "rewardPoints" INTEGER NOT NULL DEFAULT 1000000;

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "tourName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL,
    "hasVat" BOOLEAN NOT NULL DEFAULT true,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_orderCode_key" ON "bookings"("orderCode");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_orderCode_idx" ON "bookings"("orderCode");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
