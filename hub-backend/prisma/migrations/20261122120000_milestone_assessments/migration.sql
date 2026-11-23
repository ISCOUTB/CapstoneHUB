ALTER TABLE "project_milestone_rubric" RENAME TO "project_milestone_assessment";
ALTER TABLE "project_milestone_assessment" RENAME CONSTRAINT "project_milestone_rubric_pkey" TO "project_milestone_assessment_pkey";
ALTER TABLE "project_milestone_assessment" RENAME CONSTRAINT "project_milestone_rubric_project_id_fkey" TO "project_milestone_assessment_project_id_fkey";
ALTER TABLE "project_milestone_assessment" RENAME CONSTRAINT "project_milestone_rubric_updated_by_user_id_fkey" TO "project_milestone_assessment_updated_by_user_id_fkey";
ALTER INDEX "uk_project_milestone_rubric_project_program" RENAME TO "uk_project_milestone_assessment_project_program";
ALTER INDEX "idx_project_milestone_rubric_program_id" RENAME TO "idx_project_milestone_assessment_program_id";

UPDATE "project_change_history"
SET "field" = 'milestone_assessment'
WHERE "field" = 'milestone_rubric';

DROP TABLE "milestone_report";
DROP TABLE "project_milestones";
