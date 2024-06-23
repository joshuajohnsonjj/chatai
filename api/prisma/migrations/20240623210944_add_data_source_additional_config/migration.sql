-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "additionalConfig" JSONB;

-- AlterTable
ALTER TABLE "DataSourceType" ADD COLUMN     "additionalConfigTemplate" JSONB;
