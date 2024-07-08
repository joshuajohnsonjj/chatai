/*
  Warnings:

  - The values [FILE_UPLOAD] on the enum `DataSourceTypeName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DataSourceTypeName_new" AS ENUM ('SLACK', 'NOTION', 'GOOGLE_DRIVE', 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS_CHAT', 'MICROSOFT_TEAMS_MEET', 'MICROSOFT_OFFICE', 'MICROSOFT_OUTLOOK', 'MICROSOFT_ONE_NOTE', 'ATLASSIAN_JIRA', 'ATLASSIAN_CONFLUENCE', 'LINEAR', 'CLICKUP', 'ASANA');
ALTER TABLE "DataSourceType" ALTER COLUMN "name" TYPE "DataSourceTypeName_new" USING ("name"::text::"DataSourceTypeName_new");
ALTER TYPE "DataSourceTypeName" RENAME TO "DataSourceTypeName_old";
ALTER TYPE "DataSourceTypeName_new" RENAME TO "DataSourceTypeName";
DROP TYPE "DataSourceTypeName_old";
COMMIT;
