-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "reuse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "usercreatedId" TEXT;
