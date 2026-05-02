-- AlterTable
ALTER TABLE `similarity_reports` ADD COLUMN `lcs_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `semantic_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `simhash_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `style_score` DECIMAL(5, 4) NULL,
    ADD COLUMN `winnowing_score` DECIMAL(5, 4) NULL;
