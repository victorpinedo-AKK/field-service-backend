-- CreateTable
CREATE TABLE "ConstructionTaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionTaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionTaskMedia" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'photo',
    "storageProvider" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "mimeType" TEXT,
    "originalFileName" TEXT,
    "fileSizeBytes" INTEGER,
    "createdByUserId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructionTaskMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionDailyReport" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "workCompleted" TEXT,
    "blockers" TEXT,
    "materialsUsed" TEXT,
    "safetyNotes" TEXT,
    "weatherNotes" TEXT,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionDailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionTaskNote_taskId_idx" ON "ConstructionTaskNote"("taskId");

-- CreateIndex
CREATE INDEX "ConstructionTaskMedia_taskId_idx" ON "ConstructionTaskMedia"("taskId");

-- CreateIndex
CREATE INDEX "ConstructionTaskMedia_deletedAt_idx" ON "ConstructionTaskMedia"("deletedAt");

-- CreateIndex
CREATE INDEX "ConstructionDailyReport_workOrderId_idx" ON "ConstructionDailyReport"("workOrderId");

-- CreateIndex
CREATE INDEX "ConstructionDailyReport_reportDate_idx" ON "ConstructionDailyReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionDailyReport_workOrderId_reportDate_key" ON "ConstructionDailyReport"("workOrderId", "reportDate");

-- AddForeignKey
ALTER TABLE "ConstructionTaskNote" ADD CONSTRAINT "ConstructionTaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ConstructionTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionTaskNote" ADD CONSTRAINT "ConstructionTaskNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionTaskMedia" ADD CONSTRAINT "ConstructionTaskMedia_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ConstructionTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionTaskMedia" ADD CONSTRAINT "ConstructionTaskMedia_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDailyReport" ADD CONSTRAINT "ConstructionDailyReport_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionDailyReport" ADD CONSTRAINT "ConstructionDailyReport_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
