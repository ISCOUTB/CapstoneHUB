-- CreateEnum
CREATE TYPE "GuideCategory" AS ENUM ('format', 'template', 'guide');

-- CreateTable
CREATE TABLE "guide_document" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" "GuideCategory" NOT NULL DEFAULT 'format',
    "audiences" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[],
    "external_url" TEXT,
    "storage_key" VARCHAR(512),
    "original_name" VARCHAR(255),
    "mime_type" VARCHAR(150),
    "size_bytes" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_guide_document_storage_key" ON "guide_document"("storage_key");

-- CreateIndex
CREATE INDEX "idx_guide_document_category" ON "guide_document"("category");

-- CreateIndex
CREATE INDEX "idx_guide_document_is_published" ON "guide_document"("is_published");

-- CreateIndex
CREATE INDEX "idx_guide_document_uploaded_by_user_id" ON "guide_document"("uploaded_by_user_id");

-- AddForeignKey
ALTER TABLE "guide_document" ADD CONSTRAINT "guide_document_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
