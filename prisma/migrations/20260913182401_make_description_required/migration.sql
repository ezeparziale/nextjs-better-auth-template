-- Backfill any historical NULL descriptions before making the column NOT NULL.
UPDATE "permissions"
SET
    "description" = '<COMPLETE_ME>'
WHERE
    "description" IS NULL;

UPDATE "roles"
SET
    "description" = '<COMPLETE_ME>'
WHERE
    "description" IS NULL;

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "description" SET NOT NULL;