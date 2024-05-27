/*
  Warnings:

  - You are about to drop the column `isLiveSyncEnabled` on the `DataSource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DataSource" DROP COLUMN "isLiveSyncEnabled",
ADD COLUMN     "nextScheduledSync" TIMESTAMP(3);
