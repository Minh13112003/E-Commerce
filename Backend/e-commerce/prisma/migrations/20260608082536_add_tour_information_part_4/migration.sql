/*
  Warnings:

  - You are about to drop the column `content` on the `tour_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `tourCode` on the `tours` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tour_schedules" DROP COLUMN "content",
ADD COLUMN     "afternoon" TEXT,
ADD COLUMN     "evening" TEXT,
ADD COLUMN     "meals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "morning" TEXT,
ADD COLUMN     "night" TEXT,
ADD COLUMN     "noon" TEXT;

-- AlterTable
ALTER TABLE "tours" DROP COLUMN "tourCode";
