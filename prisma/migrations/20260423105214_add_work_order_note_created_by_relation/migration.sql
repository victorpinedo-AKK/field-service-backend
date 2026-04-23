-- CreateIndex
CREATE INDEX "WorkOrderNote_createdByUserId_idx" ON "WorkOrderNote"("createdByUserId");

-- AddForeignKey
ALTER TABLE "WorkOrderNote" ADD CONSTRAINT "WorkOrderNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
