-- AlterTable
ALTER TABLE `themes`
  ADD COLUMN `theme_signature` JSON NULL,
  ADD COLUMN `theme_similarity_score` DECIMAL(5, 2) NULL,
  ADD COLUMN `theme_similarity_label` VARCHAR(64) NULL;

-- CreateEnum (MySQL uses ENUM inline in ALTER TABLE)
-- AlterTable
ALTER TABLE `documents`
  ADD COLUMN `extracted_text` LONGTEXT NULL,
  ADD COLUMN `analysis_status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `analysis_queued_at` DATETIME(3) NULL,
  ADD COLUMN `analysis_started_at` DATETIME(3) NULL,
  ADD COLUMN `analysis_completed_at` DATETIME(3) NULL,
  ADD COLUMN `analysis_error` TEXT NULL;

-- CreateTable
CREATE TABLE `reference_documents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uploaded_by` BIGINT NOT NULL,
  `original_name` VARCHAR(191) NOT NULL,
  `mime_type` VARCHAR(191) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `checksum` VARCHAR(191) NOT NULL,
  `extracted_text` LONGTEXT NOT NULL,
  `theme_profile` JSON NOT NULL,
  `dominant_theme` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `reference_documents_uploaded_by_idx`(`uploaded_by`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reference_documents`
  ADD CONSTRAINT `reference_documents_uploaded_by_fkey`
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
