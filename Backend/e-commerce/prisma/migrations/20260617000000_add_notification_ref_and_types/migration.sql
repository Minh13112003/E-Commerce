-- Add refId and refType columns to notifications (safe: IF NOT EXISTS)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "refId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "refType" TEXT;

-- Add new enum values for NotificationType (safe: IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'DEPARTURE_RESCHEDULED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'DEPARTURE_RESCHEDULED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SCHEDULE_UPDATED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'SCHEDULE_UPDATED';
  END IF;
END $$;
