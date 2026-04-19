-- ============================================================
-- Migration: workflow_v2_joint_validation
-- Aligne la DB sur le workflow cible (workflow.md v2.0)
-- ============================================================

-- 1. Nouveaux statuts ThemeStatus
--    Ancien: PENDING | VALIDATED_CD | VALIDATED_DA | REJECTED
--    Nouveau: ajoute PENDING_VALIDATION | VALIDATED | DOCUMENT_SUBMITTED
--             | ANALYSIS_PENDING | APPROVED | APPROVED_WITH_MENTION
--             | CONDITIONAL_APPROVAL | REQUESTED_REVIEW | FLAGGED_PLAGIARISM
ALTER TABLE `themes`
  MODIFY COLUMN `status` ENUM(
    'PENDING',
    'PENDING_VALIDATION',
    'VALIDATED_CD',
    'VALIDATED_DA',
    'VALIDATED',
    'REJECTED',
    'DOCUMENT_SUBMITTED',
    'ANALYSIS_PENDING',
    'APPROVED',
    'APPROVED_WITH_MENTION',
    'CONDITIONAL_APPROVAL',
    'REQUESTED_REVIEW',
    'FLAGGED_PLAGIARISM'
  ) NOT NULL DEFAULT 'PENDING';

-- 2. Votes simultanés Teacher + DA sur le thème
ALTER TABLE `themes`
  ADD COLUMN `teacher_approval`     TINYINT(1)   NULL AFTER `validated_cd_at`,
  ADD COLUMN `teacher_comment`      TEXT         NULL AFTER `teacher_approval`,
  ADD COLUMN `teacher_validated_at` DATETIME(3)  NULL AFTER `teacher_comment`,
  ADD COLUMN `da_approval`          TINYINT(1)   NULL AFTER `teacher_validated_at`,
  ADD COLUMN `da_comment`           TEXT         NULL AFTER `da_approval`,
  ADD COLUMN `da_validated_at`      DATETIME(3)  NULL AFTER `da_comment`;

-- 3. Nouveaux statuts DocumentStatus sur la table documents
ALTER TABLE `documents`
  ADD COLUMN `document_status` ENUM(
    'SUBMITTED',
    'ANALYSIS_IN_PROGRESS',
    'ANALYSIS_COMPLETE',
    'CLEAN',
    'FLAGGED_PLAGIARISM',
    'ANALYSIS_PENDING',
    'APPROVED',
    'APPROVED_WITH_MENTION',
    'CONDITIONAL_APPROVAL',
    'REQUESTED_REVIEW',
    'REJECTED'
  ) NOT NULL DEFAULT 'SUBMITTED' AFTER `is_final`;

-- 4. Table final_appreciations : appréciation conjointe Teacher + DA
CREATE TABLE `final_appreciations` (
  `id`                  BIGINT        NOT NULL AUTO_INCREMENT,
  `document_id`         BIGINT        NOT NULL,
  `teacher_id`          BIGINT        NULL,
  `teacher_decision`    ENUM('APPROVED','APPROVED_WITH_MENTION','CONDITIONAL_APPROVAL','REQUESTED_REVIEW','REJECTED') NULL,
  `teacher_comment`     TEXT          NULL,
  `teacher_decided_at`  DATETIME(3)   NULL,
  `da_id`               BIGINT        NULL,
  `da_decision`         ENUM('APPROVED','APPROVED_WITH_MENTION','CONDITIONAL_APPROVAL','REQUESTED_REVIEW','REJECTED') NULL,
  `da_comment`          TEXT          NULL,
  `da_decided_at`       DATETIME(3)   NULL,
  `final_decision`      ENUM('APPROVED','APPROVED_WITH_MENTION','CONDITIONAL_APPROVAL','REQUESTED_REVIEW','REJECTED') NULL,
  `mention`             VARCHAR(64)   NULL,
  `finalized_at`        DATETIME(3)   NULL,
  `created_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `final_appreciations_document_id_key` (`document_id`),
  INDEX `final_appreciations_teacher_id_idx` (`teacher_id`),
  INDEX `final_appreciations_da_id_idx` (`da_id`),

  CONSTRAINT `final_appreciations_document_id_fkey`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `final_appreciations_teacher_id_fkey`
    FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `final_appreciations_da_id_fkey`
    FOREIGN KEY (`da_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Score plagiat combiné sur SimilarityReport (seuil 20%)
ALTER TABLE `similarity_reports`
  ADD COLUMN `plagiarism_score`    DECIMAL(5,2) NULL AFTER `ai_score`,
  ADD COLUMN `combined_score`      DECIMAL(5,2) NULL AFTER `plagiarism_score`,
  ADD COLUMN `flagged`             TINYINT(1)   NOT NULL DEFAULT 0 AFTER `combined_score`;
