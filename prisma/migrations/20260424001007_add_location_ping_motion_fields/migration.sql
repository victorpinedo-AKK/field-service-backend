-- DropIndex
DROP INDEX "LocationPing_createdAt_idx";

-- DropIndex
DROP INDEX "LocationPing_userId_idx";

-- DropIndex
DROP INDEX "LocationPing_workOrderId_idx";

-- AlterTable
ALTER TABLE "LocationPing" ADD COLUMN     "batteryLevel" DOUBLE PRECISION,
ADD COLUMN     "heading" DOUBLE PRECISION,
ADD COLUMN     "isMocked" BOOLEAN DEFAULT false,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'mobile',
ADD COLUMN     "speed" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "LocationPing_userId_createdAt_idx" ON "LocationPing"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LocationPing_workOrderId_createdAt_idx" ON "LocationPing"("workOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "LocationPing_workOrderId_userId_createdAt_idx" ON "LocationPing"("workOrderId", "userId", "createdAt");
