-- CreateEnum
CREATE TYPE "GptMessageType" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "GptMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "GptMessageType" NOT NULL,

    CONSTRAINT "GptMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GptMessage" ADD CONSTRAINT "GptMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
