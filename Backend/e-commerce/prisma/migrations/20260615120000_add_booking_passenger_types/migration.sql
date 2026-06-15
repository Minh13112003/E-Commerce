-- AlterTable: Add passenger type breakdown fields to bookings
-- adults  = number of adults  (price × 100%)
-- children = number of children (price × 80%)
-- infants = number of infants  (price × 40%)
-- quantity remains total = adults + children + infants (used for seat deduction)

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "adults"   INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "children" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "infants"  INTEGER NOT NULL DEFAULT 0;
