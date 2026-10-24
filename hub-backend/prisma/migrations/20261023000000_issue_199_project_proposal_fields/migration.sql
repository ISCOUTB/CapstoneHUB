-- AlterTable
ALTER TABLE "project"
  ADD COLUMN "engineering_area" VARCHAR(100),
  ADD COLUMN "external_advisor_name" VARCHAR(255),
  ADD COLUMN "external_advisor_email" VARCHAR(255),
  ADD COLUMN "external_nit" VARCHAR(30),
  ADD COLUMN "research_group" VARCHAR(255),
  ADD COLUMN "social_organization" VARCHAR(255),
  ADD COLUMN "social_nit" VARCHAR(30),
  ADD COLUMN "social_location" VARCHAR(255),
  ADD COLUMN "project_scope" TEXT,
  ADD COLUMN "monetary_resources" VARCHAR(10),
  ADD COLUMN "monetary_resources_description" TEXT,
  ADD COLUMN "faculty_advisors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
