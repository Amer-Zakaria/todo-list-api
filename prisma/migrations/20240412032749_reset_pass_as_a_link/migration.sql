/*
  Warnings:

  - You are about to drop the `resetpasswordrequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `resetpasswordrequest` DROP FOREIGN KEY `ResetPasswordRequest_email_fkey`;

-- DropTable
DROP TABLE `resetpasswordrequest`;
