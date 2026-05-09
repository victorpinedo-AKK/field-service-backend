-- CreateTable
CREATE TABLE "ConstructionPunchItem" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trade" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionPunchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionPunchItem_workOrderId_idx" ON "ConstructionPunchItem"("workOrderId");

-- CreateIndex
CREATE INDEX "ConstructionPunchItem_status_idx" ON "ConstructionPunchItem"("status");

-- CreateIndex
CREATE INDEX "ConstructionPunchItem_assignedToUserId_idx" ON "ConstructionPunchItem"("assignedToUserId");

-- AddForeignKey
ALTER TABLE "ConstructionPunchItem" ADD CONSTRAINT "ConstructionPunchItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionPunchItem" ADD CONSTRAINT "ConstructionPunchItem_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionPunchItem" ADD CONSTRAINT "ConstructionPunchItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
