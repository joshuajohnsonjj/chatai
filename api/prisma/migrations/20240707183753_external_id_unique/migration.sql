/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `DataSource` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DataSource_externalId_key" ON "DataSource"("externalId");
