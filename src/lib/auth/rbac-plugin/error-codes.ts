import { defineErrorCodes } from "better-auth"

export const RBAC_ERROR_CODES = defineErrorCodes({
  PERMISSION_NOT_FOUND: "Permission not found.",
  PERMISSION_ALREADY_EXISTS: "Permission with this key already exists.",
  ROLE_NOT_FOUND: "Role not found.",
  ROLE_ALREADY_EXISTS: "Role with this key already exists.",
  INVALID_PERMISSION: "Invalid permission.",
  INVALID_ROLE: "Invalid role.",
  BATCH_TOO_LARGE: "Too many ids provided in a single request.",
  CANNOT_DELETE_ASSIGNED_PERMISSION:
    "Cannot delete permission that is assigned to roles.",
  CANNOT_DELETE_ASSIGNED_ROLE: "Cannot delete role that is assigned to users.",
  CANNOT_DELETE_SYSTEM_PERMISSION: "Cannot delete system permission.",
  CANNOT_DELETE_SYSTEM_ROLE: "Cannot delete system role.",
  CANNOT_MODIFY_SYSTEM_PERMISSION: "Cannot modify system permission.",
  CANNOT_MODIFY_SYSTEM_ROLE: "Cannot modify system role.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  INVALID_PERMISSION_KEY:
    "Permission key must be alphanumeric with underscores or hyphens.",
  INVALID_ROLE_KEY: "Role key must be alphanumeric with underscores or hyphens.",
  USER_NOT_FOUND: "User not found.",
})
