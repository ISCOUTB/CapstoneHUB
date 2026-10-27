-- Consolidate the entity and social-organization NIT into one optional field.
ALTER TABLE "project" ADD COLUMN "nit" VARCHAR(30);

UPDATE "project"
SET "nit" = COALESCE("external_nit", "social_nit")
WHERE "external_nit" IS NOT NULL OR "social_nit" IS NOT NULL;

ALTER TABLE "project"
  DROP COLUMN "external_nit",
  DROP COLUMN "social_nit";
