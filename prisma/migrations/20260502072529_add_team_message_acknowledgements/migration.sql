-- CreateTable
CREATE TABLE "TeamMessageAcknowledgement" (
    "id" TEXT NOT NULL,
    "teamMessageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessageAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMessageAcknowledgement_teamMessageId_userId_key" ON "TeamMessageAcknowledgement"("teamMessageId", "userId");

-- AddForeignKey
ALTER TABLE "TeamMessageAcknowledgement" ADD CONSTRAINT "TeamMessageAcknowledgement_teamMessageId_fkey" FOREIGN KEY ("teamMessageId") REFERENCES "TeamMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessageAcknowledgement" ADD CONSTRAINT "TeamMessageAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
