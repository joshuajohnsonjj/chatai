/*
  Warnings:

  - You are about to drop the `GoogleDriveWebhookConnection` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "DataSourceTypeName" ADD VALUE 'GMAIL';

-- DropForeignKey
ALTER TABLE "GoogleDriveWebhookConnection" DROP CONSTRAINT "GoogleDriveWebhookConnection_dataSourceId_fkey";

-- DropTable
DROP TABLE "GoogleDriveWebhookConnection";
