/*
  Warnings:

  - A unique constraint covering the columns `[title_normalized]` on the table `themes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title_normalized` to the `themes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `themes` DROP FOREIGN KEY `themes_student_id_fkey`;

-- DropIndex
DROP INDEX `themes_student_title_unique` ON `themes`;

-- AlterTable
ALTER TABLE `themes` ADD COLUMN `title_normalized` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `themes_title_normalized_key` ON `themes`(`title_normalized`);

-- AddForeignKey
ALTER TABLE `similarity_reports` ADD CONSTRAINT `similarity_reports_generated_by_user_fkey` FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
