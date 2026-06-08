-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "departureFrom" TEXT NOT NULL DEFAULT 'TP. Hồ Chí Minh',
ADD COLUMN     "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tourCode" TEXT NOT NULL DEFAULT 'TOUR-001',
ADD COLUMN     "transport" TEXT NOT NULL DEFAULT 'Máy bay';

-- CreateTable
CREATE TABLE "tour_schedules" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "tour_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tour_schedules_tourId_dayNumber_key" ON "tour_schedules"("tourId", "dayNumber");

-- AddForeignKey
ALTER TABLE "tour_schedules" ADD CONSTRAINT "tour_schedules_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
