import { defineErrorCodes } from "@better-auth/core/utils"

export const RBAC_ERROR_CODES = defineErrorCodes({
  PERMISSION_NOT_FOUND: "Permission not found.",
  PERMISSION_ALREADY_EXISTS: "Permission with this key already exists.",
  ROLE_NOT_FOUND: "Role not found.",
  ROLE_ALREADY_EXISTS: "Role with this key already exists.",
  INVALID_PERMISSION: "Invalid permission.",
  INVALID_ROLE: "Invalid role.",
  CANNOT_DELETE_ASSIGNED_PERMISSION:
    "Cannot delete permission that is assigned to roles.",
  CANNOT_DELETE_ASSIGNED_ROLE: "Cannot delete role that is assigned to users.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  INVALID_PERMISSION_KEY:
    "Permission key must be alphanumeric with underscores or hyphens.",
  INVALID_ROLE_KEY: "Role key must be alphanumeric with underscores or hyphens.",
  USER_NOT_FOUND: "User not found.",
})
