/*
  Warnings:

  - You are about to drop the column `imagePublicIds` on the `tours` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `tours` table. All the data in the column will be lost.
  - Added the required column `imagePublicId` to the `tours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `tours` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tours" DROP COLUMN "imagePublicIds",
DROP COLUMN "imageUrls",
ADD COLUMN     "imagePublicId" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL;
