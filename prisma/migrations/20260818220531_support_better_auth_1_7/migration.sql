/*
Warnings:

- A unique constraint covering the columns `[issuer,accountId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
- Added the required column `issuer` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "two_factor"
ALTER COLUMN "failed_verification_count"
DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer", "accountId");