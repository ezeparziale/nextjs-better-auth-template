-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "user_id" TEXT,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_email_key" ON "invitations" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations" ("token");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations" ("email");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations" ("status");

-- CreateIndex
CREATE INDEX "invitations_expires_at_idx" ON "invitations" ("expires_at");