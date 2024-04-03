/*
  Warnings:

  - You are about to drop the column `code` on the `emailverification` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `emailverification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `emailverification` DROP COLUMN `code`,
    DROP COLUMN `expiresAt`;
