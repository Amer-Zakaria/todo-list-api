/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Todo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emailVerificationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `emailVerificationId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `emailVerification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `emailVerification_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
-- CREATE UNIQUE INDEX `Todo_userId_key` ON `Todo`(`userId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_emailVerificationId_fkey` FOREIGN KEY (`emailVerificationId`) REFERENCES `emailVerification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
