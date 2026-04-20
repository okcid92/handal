-- Allow reference documents to be stored without a linked theme
ALTER TABLE `documents` MODIFY COLUMN `theme_id` BIGINT NULL;
