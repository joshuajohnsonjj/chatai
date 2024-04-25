/*
  Warnings:

  - Made the column `category` on table `DataSourceType` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DataSourceType" ALTER COLUMN "category" SET NOT NULL;
