-- AlterEnum
ALTER TYPE "DataSyncInterval" ADD VALUE 'SEMI_DAILY';

-- AlterTable
ALTER TABLE "AccountPlan" ADD COLUMN     "dailyQueryQuota" INTEGER,
ADD COLUMN     "isAdfree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxStorageMegaBytes" INTEGER NOT NULL DEFAULT 256,
ALTER COLUMN "maxDataSources" DROP NOT NULL;
