/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerKg` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stockKg` on the `Product` table. All the data in the column will be lost.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imageUrl",
DROP COLUMN "pricePerKg",
DROP COLUMN "stockKg",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "price" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Ready',
ADD COLUMN     "stock" DECIMAL(12,3) NOT NULL;
