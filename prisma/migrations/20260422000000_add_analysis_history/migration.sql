CREATE TABLE `analysis_history` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT,
  `student_id`       BIGINT       NOT NULL,
  `document_id`      BIGINT       NULL,
  `report_id`        BIGINT       NULL,
  `file_name`        VARCHAR(512) NOT NULL,
  `detected_title`   VARCHAR(512) NULL,
  `title_score`      INT          NOT NULL DEFAULT 0,
  `similarity_score` DECIMAL(5,2) NULL,
  `blocked`          TINYINT(1)   NOT NULL DEFAULT 0,
  `title_mismatch`   TINYINT(1)   NOT NULL DEFAULT 0,
  `attempt_number`   INT          NOT NULL DEFAULT 1,
  `analyzed_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `analysis_history_student_id_idx` (`student_id`),
  CONSTRAINT `analysis_history_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
