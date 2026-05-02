-- AlterTable
ALTER TABLE "TeamMessage" ADD COLUMN     "targetWorkOrderId" TEXT;

-- CreateIndex
CREATE INDEX "TeamMessage_targetWorkOrderId_idx" ON "TeamMessage"("targetWorkOrderId");

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_targetWorkOrderId_fkey" FOREIGN KEY ("targetWorkOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
