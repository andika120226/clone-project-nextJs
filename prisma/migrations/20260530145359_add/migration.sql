-- CreateTable
CREATE TABLE "FarmerProfileHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "changedBy" TEXT,
    "summary" TEXT NOT NULL,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerProfileHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmerProfileHistory_tenantId_createdAt_idx" ON "FarmerProfileHistory"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "FarmerProfileHistory_profileId_idx" ON "FarmerProfileHistory"("profileId");

-- AddForeignKey
ALTER TABLE "FarmerProfileHistory" ADD CONSTRAINT "FarmerProfileHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
