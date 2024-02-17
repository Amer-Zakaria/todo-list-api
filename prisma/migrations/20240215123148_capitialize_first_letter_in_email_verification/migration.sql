-- DropForeignKey
ALTER TABLE `emailverification` DROP FOREIGN KEY `emailVerification_userId_fkey`;

-- AddForeignKey
ALTER TABLE `EmailVerification` ADD CONSTRAINT `EmailVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `emailverification` RENAME INDEX `emailVerification_userId_key` TO `EmailVerification_userId_key`;
