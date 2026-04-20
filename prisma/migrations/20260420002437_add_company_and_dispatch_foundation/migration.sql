-- CreateTable
CREATE TABLE "WorkOrderEvent" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchMessage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetRole" TEXT,
    "targetUserId" TEXT,
    "targetWorkOrderId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchMessageRead" (
    "id" TEXT NOT NULL,
    "dispatchMessageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderEvent_workOrderId_createdAt_idx" ON "WorkOrderEvent"("workOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetRole_idx" ON "DispatchMessage"("targetRole");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetUserId_idx" ON "DispatchMessage"("targetUserId");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetWorkOrderId_idx" ON "DispatchMessage"("targetWorkOrderId");

-- CreateIndex
CREATE INDEX "DispatchMessage_isActive_expiresAt_idx" ON "DispatchMessage"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "DispatchMessageRead_userId_idx" ON "DispatchMessageRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchMessageRead_dispatchMessageId_userId_key" ON "DispatchMessageRead"("dispatchMessageId", "userId");

-- AddForeignKey
ALTER TABLE "WorkOrderEvent" ADD CONSTRAINT "WorkOrderEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessage" ADD CONSTRAINT "DispatchMessage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessageRead" ADD CONSTRAINT "DispatchMessageRead_dispatchMessageId_fkey" FOREIGN KEY ("dispatchMessageId") REFERENCES "DispatchMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessageRead" ADD CONSTRAINT "DispatchMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
