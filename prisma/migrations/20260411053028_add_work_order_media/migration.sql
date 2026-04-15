-- CreateTable
CREATE TABLE "WorkOrderMedia" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "mimeType" TEXT,
    "originalFileName" TEXT,
    "fileSizeBytes" INTEGER,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderMedia_workOrderId_createdAt_idx" ON "WorkOrderMedia"("workOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkOrderMedia" ADD CONSTRAINT "WorkOrderMedia_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
