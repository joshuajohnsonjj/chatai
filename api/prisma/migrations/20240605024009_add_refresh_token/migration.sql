/*
  Warnings:

  - You are about to drop the column `requiredCredentialTypes` on the `DataSourceType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "refreshToken" TEXT;

-- AlterTable
ALTER TABLE "DataSourceType" DROP COLUMN "requiredCredentialTypes";
