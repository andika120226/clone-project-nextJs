-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('LOGISTICS', 'SELF_PICKUP');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'LOGISTICS',
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0;
