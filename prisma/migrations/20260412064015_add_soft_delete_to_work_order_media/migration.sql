-- AlterTable
ALTER TABLE "WorkOrderMedia" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByUserId" TEXT;
