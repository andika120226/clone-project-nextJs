-- CreateTable
CREATE TABLE "FarmerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "catalogBanner" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_tenantId_key" ON "FarmerProfile"("tenantId");

-- CreateIndex
CREATE INDEX "FarmerProfile_tenantId_idx" ON "FarmerProfile"("tenantId");
