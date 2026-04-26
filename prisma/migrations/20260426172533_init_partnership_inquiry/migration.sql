-- CreateTable
CREATE TABLE "PartnershipInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "landArea" TEXT,
    "location" TEXT,
    "monthlyNeeds" TEXT,
    "commodity" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipInquiry_pkey" PRIMARY KEY ("id")
);
