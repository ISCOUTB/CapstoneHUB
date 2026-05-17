/*
  Warnings:

  - You are about to drop the column `project_code` on the `project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "uk_project_code";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "project_code";
