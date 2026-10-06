-- Reemplaza el enum ProjectStatus: quita 'assigned' y agrega 'paused' y 'cancelled'.
-- Los proyectos y su historial en 'assigned' pasan a 'approved'.

-- 1. Nuevo enum con los valores finales.
CREATE TYPE "ProjectStatus_new" AS ENUM (
  'proposed',
  'under_review',
  'approved',
  'in_progress',
  'paused',
  'closed',
  'cancelled',
  'rejected'
);

-- 2. Remapear los datos antes de cambiar el tipo.
UPDATE "project" SET "status" = 'approved' WHERE "status" = 'assigned';
UPDATE "project_status_history" SET "previous_status" = 'approved' WHERE "previous_status" = 'assigned';
UPDATE "project_status_history" SET "next_status" = 'approved' WHERE "next_status" = 'assigned';

-- 3. Migrar las columnas al nuevo tipo.
ALTER TABLE "project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "project"
  ALTER COLUMN "status" TYPE "ProjectStatus_new"
  USING ("status"::text::"ProjectStatus_new");
ALTER TABLE "project" ALTER COLUMN "status" SET DEFAULT 'proposed';

ALTER TABLE "project_status_history"
  ALTER COLUMN "previous_status" TYPE "ProjectStatus_new"
  USING ("previous_status"::text::"ProjectStatus_new");

ALTER TABLE "project_status_history"
  ALTER COLUMN "next_status" TYPE "ProjectStatus_new"
  USING ("next_status"::text::"ProjectStatus_new");

-- 4. Reemplazar el tipo anterior.
DROP TYPE "ProjectStatus";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
