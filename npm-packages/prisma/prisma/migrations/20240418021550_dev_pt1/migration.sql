/*
  Warnings:

  - The values [ORGANIZATION_ADMIN,ORGANIZATION_OWNER] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `AccountPlan` table. All the data in the column will be lost.
  - You are about to drop the column `stripeId` on the `AccountPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeProductId]` on the table `AccountPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `DataSource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerEntityId,dataSourceTypeId]` on the table `DataSource` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `adHocUploadsEnabled` to the `AccountPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataSyncInterval` to the `AccountPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integrationsEnabled` to the `AccountPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDataSources` to the `AccountPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeProductId` to the `AccountPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `associatedEntityId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DataSyncInterval" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "UserInviteType" AS ENUM ('MEMBER', 'ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('INDIVIDUAL', 'ORGANIZATION_MEMBER');
ALTER TABLE "User" ALTER COLUMN "type" TYPE "UserType_new" USING ("type"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "UserType_old";
COMMIT;

-- DropIndex
DROP INDEX "AccountPlan_stripeId_key";

-- AlterTable
ALTER TABLE "AccountPlan" DROP COLUMN "name",
DROP COLUMN "stripeId",
ADD COLUMN     "adHocUploadsEnabled" BOOLEAN NOT NULL,
ADD COLUMN     "dailyMessageQuota" INTEGER,
ADD COLUMN     "dataSyncInterval" "DataSyncInterval" NOT NULL,
ADD COLUMN     "integrationsEnabled" BOOLEAN NOT NULL,
ADD COLUMN     "maxDataSources" INTEGER NOT NULL,
ADD COLUMN     "stripeProductId" TEXT NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "associatedEntityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "isSyncing" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isAccountActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resentAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "type" "UserInviteType" NOT NULL,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountPlan_stripeProductId_key" ON "AccountPlan"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_externalId_key" ON "DataSource"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_ownerEntityId_dataSourceTypeId_key" ON "DataSource"("ownerEntityId", "dataSourceTypeId");

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
