-- CreateTable
CREATE TABLE "project_program_requirement" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "program_id" VARCHAR(100) NOT NULL,
    "student_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_program_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_project_program_requirement"
ON "project_program_requirement"("project_id", "program_id");

-- CreateIndex
CREATE INDEX "idx_project_program_requirement_program_id"
ON "project_program_requirement"("program_id");

-- AddForeignKey
ALTER TABLE "project_program_requirement"
ADD CONSTRAINT "project_program_requirement_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
