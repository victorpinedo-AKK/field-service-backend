/*
  Warnings:

  - The `status` column on the `WorkOrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WorkOrderItemStatus" AS ENUM ('pending', 'completed', 'skipped');

-- AlterTable
ALTER TABLE "DispatchMessage" ADD COLUMN     "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "searchText" TEXT;

-- AlterTable
ALTER TABLE "WorkOrderItem" ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkOrderItemStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "UserLocationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMessage" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLocationLog_userId_createdAt_idx" ON "UserLocationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TeamMessage_teamId_createdAt_idx" ON "TeamMessage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkOrder_customerReferenceNumber_idx" ON "WorkOrder"("customerReferenceNumber");

-- CreateIndex
CREATE INDEX "WorkOrder_externalSource_externalId_idx" ON "WorkOrder"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "WorkOrder_isLocked_idx" ON "WorkOrder"("isLocked");

-- CreateIndex
CREATE INDEX "WorkOrderItem_workOrderId_status_idx" ON "WorkOrderItem"("workOrderId", "status");

-- AddForeignKey
ALTER TABLE "UserLocationLog" ADD CONSTRAINT "UserLocationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
