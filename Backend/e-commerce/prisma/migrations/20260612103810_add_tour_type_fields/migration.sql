-- AlterTable: Add TypeTour hierarchy fields to tours
-- These columns already exist in the database (applied via db execute).
-- This migration file registers them in Prisma's migration history.

ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "tourCountry" TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "tourRegion"  TEXT;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "tourCity"    TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tours_tourCountry_idx" ON "tours"("tourCountry");
CREATE INDEX IF NOT EXISTS "tours_tourCountry_tourRegion_idx" ON "tours"("tourCountry", "tourRegion");
CREATE INDEX IF NOT EXISTS "tours_tourCountry_tourRegion_tourCity_idx" ON "tours"("tourCountry", "tourRegion", "tourCity");
