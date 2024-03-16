/*
  Warnings:

  - You are about to drop the column `emailVerificationId` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_emailVerificationId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `emailVerificationId`;

-- AddForeignKey
ALTER TABLE `EmailVerification` ADD CONSTRAINT `emailVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
