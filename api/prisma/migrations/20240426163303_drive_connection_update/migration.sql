/*
  Warnings:

  - A unique constraint covering the columns `[resourceId]` on the table `GoogleDriveWebhookConnection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[creatorUserId]` on the table `GoogleDriveWebhookConnection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorUserId` to the `GoogleDriveWebhookConnection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoogleDriveWebhookConnection" ADD COLUMN     "creatorUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveWebhookConnection_resourceId_key" ON "GoogleDriveWebhookConnection"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveWebhookConnection_creatorUserId_key" ON "GoogleDriveWebhookConnection"("creatorUserId");
