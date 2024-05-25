-- CreateEnum
CREATE TYPE "InternalAPIKeyScope" AS ENUM ('ALL', 'DATA_SOURCE');

-- CreateTable
CREATE TABLE "InternalAPIKey" (
    "key" TEXT NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "scopes" "InternalAPIKeyScope"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalAPIKey_pkey" PRIMARY KEY ("key")
);
