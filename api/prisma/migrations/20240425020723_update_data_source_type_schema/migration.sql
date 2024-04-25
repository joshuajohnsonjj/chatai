-- CreateEnum
CREATE TYPE "DataSourceCategory" AS ENUM ('COMMUNICATION', 'PROJECT_MANAGEMENT', 'NOTE_TAKING', 'OTHER');

-- AlterTable
ALTER TABLE "DataSourceType" ADD COLUMN     "category" "DataSourceCategory",
ADD COLUMN     "isLiveSyncAvailable" BOOLEAN NOT NULL DEFAULT false;
