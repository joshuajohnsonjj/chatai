/*
  Warnings:

  - A unique constraint covering the columns `[secret]` on the table `DataSource` will be added. If there are existing duplicate values, this will fail.
  - Made the column `secret` on table `DataSource` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "isLiveSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "secret" SET NOT NULL;

-- AlterTable
ALTER TABLE "DataSourceType" ADD COLUMN     "requiredCredentialTypes" TEXT[];

-- CreateTable
CREATE TABLE "GoogleDriveWebhookConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,

    CONSTRAINT "GoogleDriveWebhookConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveWebhookConnection_connectionId_key" ON "GoogleDriveWebhookConnection"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveWebhookConnection_dataSourceId_key" ON "GoogleDriveWebhookConnection"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_secret_key" ON "DataSource"("secret");

-- AddForeignKey
ALTER TABLE "GoogleDriveWebhookConnection" ADD CONSTRAINT "GoogleDriveWebhookConnection_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
