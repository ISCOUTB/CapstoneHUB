CREATE TABLE "project_milestone_rubric" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "program_id" VARCHAR(100) NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "updated_by_user_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_milestone_rubric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uk_project_milestone_rubric_project_program" ON "project_milestone_rubric"("project_id", "program_id");
CREATE INDEX "idx_project_milestone_rubric_program_id" ON "project_milestone_rubric"("program_id");
ALTER TABLE "project_milestone_rubric" ADD CONSTRAINT "project_milestone_rubric_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_milestone_rubric" ADD CONSTRAINT "project_milestone_rubric_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
