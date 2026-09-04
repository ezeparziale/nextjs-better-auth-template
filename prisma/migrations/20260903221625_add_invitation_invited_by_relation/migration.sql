-- AlterTable
ALTER TABLE "invitations" ADD COLUMN "invited_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;