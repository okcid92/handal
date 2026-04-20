-- Add is_reference field to documents table to distinguish reference docs from student submissions
ALTER TABLE `documents` ADD COLUMN `is_reference` BOOLEAN NOT NULL DEFAULT false AFTER `is_final`;

-- Create index for efficient filtering
CREATE INDEX `documents_is_reference_idx` ON `documents`(`is_reference`);

-- Ensure existing student documents are marked as non-reference
UPDATE `documents` SET `is_reference` = false WHERE `is_reference` IS NULL;
