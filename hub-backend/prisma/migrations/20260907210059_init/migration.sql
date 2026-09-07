-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('proposed', 'under_review', 'approved', 'assigned', 'in_progress', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'evaluator', 'coordinator', 'advisor', 'student');

-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('advisor', 'coordinator', 'student', 'evaluator');

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

-- CreateTable
CREATE TABLE "user_role_assignment" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "UserRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'proposed',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "estimated_cost" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_school" (
    "project_id" INTEGER NOT NULL,
    "school_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_school_pkey" PRIMARY KEY ("project_id","school_name")
);

-- CreateTable
CREATE TABLE "project_natural_proposer" (
    "project_id" INTEGER NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "id_number" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_natural_proposer_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "project_legal_proposer" (
    "project_id" INTEGER NOT NULL,
    "legal_name" VARCHAR(255) NOT NULL,
    "nit" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "contact_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_legal_proposer_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "project_actor_assignment" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "ActorRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_actor_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_observation" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "author_user_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_status_history" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "previous_status" "ProjectStatus",
    "next_status" "ProjectStatus" NOT NULL,
    "description" TEXT,
    "author_user_id" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_email" ON "user"("email");

-- CreateIndex
CREATE INDEX "idx_user_full_name" ON "user"("full_name");

-- CreateIndex
CREATE INDEX "idx_user_role_assignment_user_id" ON "user_role_assignment"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_role_assignment_role" ON "user_role_assignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_role_assignment" ON "user_role_assignment"("user_id", "role");

-- CreateIndex
CREATE INDEX "idx_project_status" ON "project"("status");

-- CreateIndex
CREATE INDEX "idx_project_start_date" ON "project"("start_date");

-- CreateIndex
CREATE INDEX "idx_project_created_at" ON "project"("created_at");

-- CreateIndex
CREATE INDEX "idx_project_school_name" ON "project_school"("school_name");

-- CreateIndex
CREATE INDEX "idx_project_natural_id_number" ON "project_natural_proposer"("id_number");

-- CreateIndex
CREATE INDEX "idx_project_natural_email" ON "project_natural_proposer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uk_project_legal_nit" ON "project_legal_proposer"("nit");

-- CreateIndex
CREATE INDEX "idx_project_legal_nit" ON "project_legal_proposer"("nit");

-- CreateIndex
CREATE INDEX "idx_project_legal_email" ON "project_legal_proposer"("email");

-- CreateIndex
CREATE INDEX "idx_project_user_project_id" ON "project_actor_assignment"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_user_user_id" ON "project_actor_assignment"("user_id");

-- CreateIndex
CREATE INDEX "idx_project_actor_role" ON "project_actor_assignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "uk_project_user" ON "project_actor_assignment"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_project_observation_project_id" ON "project_observation"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_observation_author_user_id" ON "project_observation"("author_user_id");

-- CreateIndex
CREATE INDEX "idx_project_observation_created_at" ON "project_observation"("created_at");

-- CreateIndex
CREATE INDEX "idx_project_status_history_project_id" ON "project_status_history"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_status_history_next_status" ON "project_status_history"("next_status");

-- CreateIndex
CREATE INDEX "idx_project_status_history_changed_at" ON "project_status_history"("changed_at");

-- AddForeignKey
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_school" ADD CONSTRAINT "project_school_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_natural_proposer" ADD CONSTRAINT "project_natural_proposer_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_legal_proposer" ADD CONSTRAINT "project_legal_proposer_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_actor_assignment" ADD CONSTRAINT "project_actor_assignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_actor_assignment" ADD CONSTRAINT "project_actor_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_observation" ADD CONSTRAINT "project_observation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_observation" ADD CONSTRAINT "project_observation_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
