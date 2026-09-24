-- AlterTable
ALTER TABLE "project" ADD COLUMN "is_private" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "project" ADD COLUMN "proposer_user_id" INTEGER;

-- CreateIndex
CREATE INDEX "idx_project_is_private" ON "project"("is_private");

-- CreateIndex
CREATE INDEX "idx_project_proposer_user_id" ON "project"("proposer_user_id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_proposer_user_id_fkey" FOREIGN KEY ("proposer_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
