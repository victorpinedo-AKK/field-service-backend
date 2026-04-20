/*
  Warnings:

  - The `targetRole` column on the `DispatchMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('internal', 'subcontractor', 'partner');

-- CreateEnum
CREATE TYPE "MessageTargetScope" AS ENUM ('all_active_field', 'role', 'user', 'work_order', 'company');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('general', 'operations', 'sop', 'safety', 'maintenance', 'payroll_1099');

-- DropIndex
DROP INDEX "DispatchMessage_isActive_expiresAt_idx";

-- DropIndex
DROP INDEX "WorkOrder_internalStatus_scheduledStartAt_idx";

-- AlterTable
ALTER TABLE "DispatchMessage" ADD COLUMN     "messageCategory" "MessageCategory" NOT NULL DEFAULT 'general',
ADD COLUMN     "targetCompanyId" TEXT,
ADD COLUMN     "targetScope" "MessageTargetScope" NOT NULL DEFAULT 'all_active_field',
DROP COLUMN "targetRole",
ADD COLUMN     "targetRole" "UserRole";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "division" "Division";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL,
    "division" "Division",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_companyType_isActive_idx" ON "Company"("companyType", "isActive");

-- CreateIndex
CREATE INDEX "Company_division_isActive_idx" ON "Company"("division", "isActive");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetScope_idx" ON "DispatchMessage"("targetScope");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetRole_idx" ON "DispatchMessage"("targetRole");

-- CreateIndex
CREATE INDEX "DispatchMessage_targetCompanyId_idx" ON "DispatchMessage"("targetCompanyId");

-- CreateIndex
CREATE INDEX "DispatchMessage_messageCategory_idx" ON "DispatchMessage"("messageCategory");

-- CreateIndex
CREATE INDEX "DispatchMessage_priority_isActive_expiresAt_idx" ON "DispatchMessage"("priority", "isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "Team_teamType_isActive_idx" ON "Team"("teamType", "isActive");

-- CreateIndex
CREATE INDEX "Team_division_isActive_idx" ON "Team"("division", "isActive");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "WorkOrder_division_internalStatus_scheduledStartAt_idx" ON "WorkOrder"("division", "internalStatus", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "WorkOrder_jobType_division_idx" ON "WorkOrder"("jobType", "division");

-- CreateIndex
CREATE INDEX "WorkOrderAssignment_workOrderId_isActive_idx" ON "WorkOrderAssignment"("workOrderId", "isActive");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessage" ADD CONSTRAINT "DispatchMessage_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessage" ADD CONSTRAINT "DispatchMessage_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchMessage" ADD CONSTRAINT "DispatchMessage_targetWorkOrderId_fkey" FOREIGN KEY ("targetWorkOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
