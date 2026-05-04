-- CreateTable
CREATE TABLE "ConstructionTimeEntry" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "clockInLat" DOUBLE PRECISION,
    "clockInLng" DOUBLE PRECISION,
    "clockOutLat" DOUBLE PRECISION,
    "clockOutLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConstructionTimeEntry_workOrderId_idx" ON "ConstructionTimeEntry"("workOrderId");

-- CreateIndex
CREATE INDEX "ConstructionTimeEntry_userId_idx" ON "ConstructionTimeEntry"("userId");

-- CreateIndex
CREATE INDEX "ConstructionTimeEntry_clockOutAt_idx" ON "ConstructionTimeEntry"("clockOutAt");

-- AddForeignKey
ALTER TABLE "ConstructionTimeEntry" ADD CONSTRAINT "ConstructionTimeEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionTimeEntry" ADD CONSTRAINT "ConstructionTimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
