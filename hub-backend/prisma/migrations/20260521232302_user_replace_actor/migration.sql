/*
  Warnings:

  - You are about to drop the column `actor_id` on the `project_actor_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `author_actor_id` on the `project_status_history` table. All the data in the column will be lost.
  - You are about to drop the `actor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[project_id,user_id]` on the table `project_actor_assignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `project_actor_assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "project_actor_assignment" DROP CONSTRAINT "project_actor_assignment_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "project_status_history" DROP CONSTRAINT "project_status_history_author_actor_id_fkey";

-- DropIndex
DROP INDEX "idx_project_actor_actor_id";

-- DropIndex
DROP INDEX "uk_project_actor";

-- AlterTable
ALTER TABLE "project_actor_assignment" DROP COLUMN "actor_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "project_status_history" DROP COLUMN "author_actor_id",
ADD COLUMN     "author_user_id" INTEGER;

-- DropTable
DROP TABLE "actor";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_email" ON "user"("email");

-- CreateIndex
CREATE INDEX "idx_user_full_name" ON "user"("full_name");

-- CreateIndex
CREATE INDEX "idx_project_user_user_id" ON "project_actor_assignment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_project_user" ON "project_actor_assignment"("project_id", "user_id");

-- AddForeignKey
ALTER TABLE "project_actor_assignment" ADD CONSTRAINT "project_actor_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_project_actor_project_id" RENAME TO "idx_project_user_project_id";
