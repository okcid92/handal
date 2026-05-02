-- DropForeignKey
ALTER TABLE `deliberations` DROP FOREIGN KEY `deliberations_decided_by_fkey`;

-- DropForeignKey
ALTER TABLE `deliberations` DROP FOREIGN KEY `deliberations_similarity_report_id_fkey`;

-- DropForeignKey
ALTER TABLE `themes` DROP FOREIGN KEY `themes_moderated_by_fkey`;

-- DropForeignKey
ALTER TABLE `themes` DROP FOREIGN KEY `themes_validated_cd_by_fkey`;

-- DropForeignKey
ALTER TABLE `themes` DROP FOREIGN KEY `themes_validated_da_by_fkey`;

-- DropIndex
DROP INDEX `themes_moderated_by_fkey` ON `themes`;

-- DropIndex
DROP INDEX `themes_validated_cd_by_fkey` ON `themes`;

-- DropIndex
DROP INDEX `themes_validated_da_by_fkey` ON `themes`;

-- AlterTable
ALTER TABLE `documents` MODIFY `document_status` ENUM('SUBMITTED', 'ANALYSIS_IN_PROGRESS', 'ANALYSIS_COMPLETE', 'CLEAN', 'FLAGGED_PLAGIARISM', 'APPROVED', 'APPROVED_WITH_MENTION', 'CONDITIONAL_APPROVAL', 'REQUESTED_REVIEW', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE `final_appreciations` MODIFY `mention` VARCHAR(100) NULL,
    ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `similarity_reports` ADD COLUMN `cosine_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `jaccard_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `ngram_score` DECIMAL(5, 4) NULL;

-- AlterTable
ALTER TABLE `themes` DROP COLUMN `da_approval`,
    DROP COLUMN `da_validated_at`,
    DROP COLUMN `final_score`,
    DROP COLUMN `final_score_assigned_at`,
    DROP COLUMN `moderated_at`,
    DROP COLUMN `moderated_by`,
    DROP COLUMN `moderation_comment`,
    DROP COLUMN `teacher_approval`,
    DROP COLUMN `teacher_validated_at`,
    DROP COLUMN `theme_similarity_label`,
    DROP COLUMN `validated_cd_at`,
    DROP COLUMN `validated_cd_by`,
    DROP COLUMN `validated_da_at`,
    DROP COLUMN `validated_da_by`,
    ADD COLUMN `da_vote` VARCHAR(191) NULL,
    ADD COLUMN `da_voted_at` DATETIME(3) NULL,
    ADD COLUMN `teacher_vote` VARCHAR(191) NULL,
    ADD COLUMN `teacher_voted_at` DATETIME(3) NULL,
    MODIFY `title` VARCHAR(500) NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `status` ENUM('PENDING', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    MODIFY `title_normalized` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `deliberations`;

-- CreateIndex
CREATE INDEX `themes_student_id_idx` ON `themes`(`student_id`);

-- AddForeignKey
ALTER TABLE `themes` ADD CONSTRAINT `themes_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
