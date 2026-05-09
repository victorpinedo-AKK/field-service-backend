-- CreateTable
CREATE TABLE "ConstructionInspection" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL DEFAULT 'final_walkthrough',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "inspectorUserId" TEXT,
    "notes" TEXT,
    "failedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionInspection_workOrderId_idx" ON "ConstructionInspection"("workOrderId");

-- CreateIndex
CREATE INDEX "ConstructionInspection_status_idx" ON "ConstructionInspection"("status");

-- CreateIndex
CREATE INDEX "ConstructionInspection_inspectorUserId_idx" ON "ConstructionInspection"("inspectorUserId");

-- AddForeignKey
ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_inspectorUserId_fkey" FOREIGN KEY ("inspectorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
