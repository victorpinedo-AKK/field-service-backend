-- CreateEnum
CREATE TYPE "Division" AS ENUM ('construction', 'hotshots', 'sales', 'trucking');

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "division" "Division" NOT NULL DEFAULT 'construction';

-- CreateTable
CREATE TABLE "HotShotDetails" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "pickupName" TEXT,
    "pickupPhone" TEXT,
    "pickupAddress1" TEXT NOT NULL,
    "pickupAddress2" TEXT,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupPostalCode" TEXT NOT NULL,
    "dropoffName" TEXT,
    "dropoffPhone" TEXT,
    "dropoffAddress1" TEXT NOT NULL,
    "dropoffAddress2" TEXT,
    "dropoffCity" TEXT NOT NULL,
    "dropoffState" TEXT NOT NULL,
    "dropoffPostalCode" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "HotShotDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotShotDetails_workOrderId_key" ON "HotShotDetails"("workOrderId");

-- AddForeignKey
ALTER TABLE "HotShotDetails" ADD CONSTRAINT "HotShotDetails_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
