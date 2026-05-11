-- CreateTable
CREATE TABLE "ConstructionCustomerSignoff" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "agreedWorkSummary" TEXT NOT NULL,
    "customerNotes" TEXT,
    "signatureImageUrl" TEXT,
    "signatureImageKey" TEXT,
    "pdfUrl" TEXT,
    "pdfKey" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionCustomerSignoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionCustomerSignoff_workOrderId_idx" ON "ConstructionCustomerSignoff"("workOrderId");

-- CreateIndex
CREATE INDEX "ConstructionCustomerSignoff_createdByUserId_idx" ON "ConstructionCustomerSignoff"("createdByUserId");

-- AddForeignKey
ALTER TABLE "ConstructionCustomerSignoff" ADD CONSTRAINT "ConstructionCustomerSignoff_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionCustomerSignoff" ADD CONSTRAINT "ConstructionCustomerSignoff_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
