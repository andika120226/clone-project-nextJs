/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `LogisticsVehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LogisticsVehicle_name_key" ON "LogisticsVehicle"("name");
