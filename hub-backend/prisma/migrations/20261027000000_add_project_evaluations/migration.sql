-- Rúbricas, asignaciones por proyecto/fase y evaluaciones semestrales.

CREATE TABLE "rubric_template" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "area" VARCHAR(120),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rubric_criterion" (
    "id" SERIAL NOT NULL,
    "rubric_template_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "weight_percent" INTEGER NOT NULL,

    CONSTRAINT "rubric_criterion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_rubric_assignment" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "phase" "ProjectPhase" NOT NULL,
    "rubric_template_id" INTEGER NOT NULL,
    "assigned_by_user_id" INTEGER,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_rubric_assignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_evaluation" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "phase" "ProjectPhase" NOT NULL,
    "evaluator_user_id" INTEGER NOT NULL,
    "rubric_template_id" INTEGER NOT NULL,
    "total_score" DECIMAL(3,2) NOT NULL,
    "general_comment" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_evaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_evaluation_criterion" (
    "id" SERIAL NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "weight_percent" INTEGER NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "project_evaluation_criterion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_rubric_template_is_active" ON "rubric_template"("is_active");
CREATE INDEX "idx_rubric_template_area" ON "rubric_template"("area");
CREATE UNIQUE INDEX "uk_rubric_template_default" ON "rubric_template"("is_default") WHERE "is_default" = true;
CREATE UNIQUE INDEX "uk_rubric_criterion_template_position" ON "rubric_criterion"("rubric_template_id", "position");
CREATE INDEX "idx_rubric_criterion_template_id" ON "rubric_criterion"("rubric_template_id");
CREATE UNIQUE INDEX "uk_project_rubric_assignment_phase" ON "project_rubric_assignment"("project_id", "phase");
CREATE INDEX "idx_project_rubric_assignment_template_id" ON "project_rubric_assignment"("rubric_template_id");
CREATE UNIQUE INDEX "uk_project_evaluation" ON "project_evaluation"("project_id", "phase", "evaluator_user_id");
CREATE INDEX "idx_project_evaluation_project_phase" ON "project_evaluation"("project_id", "phase");
CREATE INDEX "idx_project_evaluation_evaluator_user_id" ON "project_evaluation"("evaluator_user_id");
CREATE INDEX "idx_project_evaluation_template_id" ON "project_evaluation"("rubric_template_id");
CREATE UNIQUE INDEX "uk_project_evaluation_criterion_position" ON "project_evaluation_criterion"("evaluation_id", "position");
CREATE INDEX "idx_project_evaluation_criterion_evaluation_id" ON "project_evaluation_criterion"("evaluation_id");

ALTER TABLE "rubric_template" ADD CONSTRAINT "rubric_template_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rubric_criterion" ADD CONSTRAINT "rubric_criterion_rubric_template_id_fkey" FOREIGN KEY ("rubric_template_id") REFERENCES "rubric_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_rubric_assignment" ADD CONSTRAINT "project_rubric_assignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_rubric_assignment" ADD CONSTRAINT "project_rubric_assignment_rubric_template_id_fkey" FOREIGN KEY ("rubric_template_id") REFERENCES "rubric_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_rubric_assignment" ADD CONSTRAINT "project_rubric_assignment_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_evaluation" ADD CONSTRAINT "project_evaluation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_evaluation" ADD CONSTRAINT "project_evaluation_evaluator_user_id_fkey" FOREIGN KEY ("evaluator_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_evaluation" ADD CONSTRAINT "project_evaluation_rubric_template_id_fkey" FOREIGN KEY ("rubric_template_id") REFERENCES "rubric_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_evaluation_criterion" ADD CONSTRAINT "project_evaluation_criterion_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "project_evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rúbrica general del sistema: fallback cuando el proyecto/fase no tiene una
-- plantilla asignada.
WITH default_rubric AS (
    INSERT INTO "rubric_template" (
        "name",
        "description",
        "is_default",
        "is_active",
        "created_at",
        "updated_at"
    )
    VALUES (
        'Nota general',
        'Rúbrica general por defecto: una sola nota sobre 5.0.',
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING "id"
)
INSERT INTO "rubric_criterion" (
    "rubric_template_id",
    "position",
    "title",
    "description",
    "weight_percent"
)
SELECT "id", 1, 'Nota general', 'Calificación general del proyecto.', 100
FROM default_rubric;
