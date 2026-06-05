/*
  Warnings:

  - You are about to drop the column `bookingDate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `hasVat` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `imagePublicId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `orderCode` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `tourName` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `idTour` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_userId_fkey";

-- DropIndex
DROP INDEX "bookings_orderCode_idx";

-- DropIndex
DROP INDEX "bookings_orderCode_key";

-- DropIndex
DROP INDEX "bookings_userId_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "bookingDate",
DROP COLUMN "currency",
DROP COLUMN "hasVat",
DROP COLUMN "imagePublicId",
DROP COLUMN "imageUrl",
DROP COLUMN "orderCode",
DROP COLUMN "price",
DROP COLUMN "status",
DROP COLUMN "tourName",
DROP COLUMN "userId",
ADD COLUMN     "idTour" TEXT NOT NULL,
ADD COLUMN     "idUser" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "duration" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_idUser_idx" ON "bookings"("idUser");

-- CreateIndex
CREATE INDEX "bookings_idTour_idx" ON "bookings"("idTour");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_idTour_fkey" FOREIGN KEY ("idTour") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
