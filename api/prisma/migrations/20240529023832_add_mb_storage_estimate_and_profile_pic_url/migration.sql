-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "mbStorageEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" TEXT;
