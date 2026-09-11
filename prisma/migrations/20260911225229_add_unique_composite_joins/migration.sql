/*
  Warnings:

  - A unique constraint covering the columns `[role_id,permission_id]` on the table `roles_permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,role_id]` on the table `users_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "roles_permissions_role_id_permission_id_key" ON "roles_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_roles_user_id_role_id_key" ON "users_roles"("user_id", "role_id");
