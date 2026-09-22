-- AlterTable
ALTER TABLE "permissions"
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "roles"
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark everything previously created by the seed as system
UPDATE "permissions"
SET
    "is_system" = true
WHERE
    "created_by" = 'system';

UPDATE "roles" SET "is_system" = true WHERE "created_by" = 'system';