/*
  Warnings:

  - You are about to drop the column `emailVerificationId` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_emailVerificationId_fkey`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `emailVerificationId`;

-- AddForeignKey
ALTER TABLE `emailVerification` ADD CONSTRAINT `emailVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
