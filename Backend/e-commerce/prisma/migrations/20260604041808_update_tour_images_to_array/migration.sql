/*
  Warnings:

  - You are about to drop the column `imagePublicId` on the `tours` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `tours` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tours" DROP COLUMN "imagePublicId",
DROP COLUMN "imageUrl",
ADD COLUMN     "imagePublicIds" TEXT[],
ADD COLUMN     "imageUrls" TEXT[];
