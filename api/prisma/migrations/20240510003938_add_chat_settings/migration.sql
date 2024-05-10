-- CreateEnum
CREATE TYPE "ChatTone" AS ENUM ('CASUAL', 'DEFAULT', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "baseInstructions" TEXT,
ADD COLUMN     "chatCreativity" INTEGER,
ADD COLUMN     "chatMinConfidence" INTEGER,
ADD COLUMN     "chatTone" "ChatTone",
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EntitySettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newsletterNotification" BOOLEAN NOT NULL DEFAULT true,
    "usageNotification" BOOLEAN NOT NULL DEFAULT true,
    "chatCreativity" INTEGER NOT NULL DEFAULT 4,
    "chatMinConfidence" INTEGER NOT NULL DEFAULT 8,
    "chatTone" "ChatTone" NOT NULL DEFAULT 'DEFAULT',
    "baseInstructions" TEXT,
    "associatedUserId" TEXT,
    "associatedOrganizationId" TEXT,

    CONSTRAINT "EntitySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntitySettings_associatedUserId_key" ON "EntitySettings"("associatedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EntitySettings_associatedOrganizationId_key" ON "EntitySettings"("associatedOrganizationId");

-- AddForeignKey
ALTER TABLE "EntitySettings" ADD CONSTRAINT "EntitySettings_associatedUserId_fkey" FOREIGN KEY ("associatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitySettings" ADD CONSTRAINT "EntitySettings_associatedOrganizationId_fkey" FOREIGN KEY ("associatedOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
