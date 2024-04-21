/*
  Warnings:

  - You are about to drop the column `name` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GptMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Questionaire` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionaireCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionaireQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionaireResponse` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `planId` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "DataSourceTypeName" AS ENUM ('SLACK', 'NOTION', 'GOOGLE_DRIVE', 'FILE_UPLOAD');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INDIVIDUAL', 'ORGANIZATION_MEMBER', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('SYSTEM', 'SLACK', 'MICROSOFT_TEAMS');

-- DropForeignKey
ALTER TABLE "GptMessage" DROP CONSTRAINT "GptMessage_projectId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireCategory" DROP CONSTRAINT "QuestionaireCategory_questionaireId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireQuestion" DROP CONSTRAINT "QuestionaireQuestion_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireQuestion" DROP CONSTRAINT "QuestionaireQuestion_projectId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireQuestion" DROP CONSTRAINT "QuestionaireQuestion_questionaireId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireResponse" DROP CONSTRAINT "QuestionaireResponse_projectId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionaireResponse" DROP CONSTRAINT "QuestionaireResponse_questionId_fkey";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "name",
ADD COLUMN     "planId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "GptMessage";

-- DropTable
DROP TABLE "OrganizationMember";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Questionaire";

-- DropTable
DROP TABLE "QuestionaireCategory";

-- DropTable
DROP TABLE "QuestionaireQuestion";

-- DropTable
DROP TABLE "QuestionaireResponse";

-- DropEnum
DROP TYPE "GptMessageType";

-- DropEnum
DROP TYPE "OrganizationMemberRole";

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSync" TIMESTAMP(3),
    "dataSourceTypeId" TEXT NOT NULL,
    "ownerEntityId" TEXT NOT NULL,
    "ownerEntityType" "EntityType" NOT NULL,
    "secret" TEXT NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSourceType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" "DataSourceTypeName" NOT NULL,

    CONSTRAINT "DataSourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "UserType" NOT NULL,
    "planId" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountPlan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,

    CONSTRAINT "AccountPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chatType" "ChatType" NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "isSystemMessage" BOOLEAN NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceType_name_key" ON "DataSourceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AccountPlan_stripeId_key" ON "AccountPlan"("stripeId");

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_dataSourceTypeId_fkey" FOREIGN KEY ("dataSourceTypeId") REFERENCES "DataSourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AccountPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AccountPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
