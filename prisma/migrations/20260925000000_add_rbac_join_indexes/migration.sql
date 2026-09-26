-- DropIndex
DROP INDEX "roles_key_idx";

-- DropIndex
DROP INDEX "permissions_key_idx";

-- CreateIndex
CREATE INDEX "users_roles_role_id_idx" ON "users_roles"("role_id");

-- CreateIndex
CREATE INDEX "roles_permissions_permission_id_role_id_idx" ON "roles_permissions"("permission_id", "role_id");

