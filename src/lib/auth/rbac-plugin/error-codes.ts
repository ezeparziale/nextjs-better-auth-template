import { defineErrorCodes } from "better-auth"

export const RBAC_ERROR_CODES = defineErrorCodes({
  PERMISSION_NOT_FOUND: "Permission not found.",
  PERMISSION_ALREADY_EXISTS: "Permission with this key already exists.",
  ROLE_NOT_FOUND: "Role not found.",
  ROLE_ALREADY_EXISTS: "Role with this key already exists.",
  BATCH_TOO_LARGE: "Too many ids provided in a single request.",
  CANNOT_DELETE_ASSIGNED_PERMISSION:
    "Cannot delete permission that is assigned to roles.",
  CANNOT_DELETE_ASSIGNED_ROLE: "Cannot delete role that is assigned to users.",
  CANNOT_DELETE_SYSTEM_PERMISSION: "Cannot delete system permission.",
  CANNOT_DELETE_SYSTEM_ROLE: "Cannot delete system role.",
  CANNOT_MODIFY_SYSTEM_PERMISSION: "Cannot modify system permission.",
  CANNOT_MODIFY_SYSTEM_ROLE: "Cannot modify system role.",
  USER_NOT_FOUND: "User not found.",
  EMPTY_PERMISSION_KEY: "Permission key cannot be empty.",
  EMPTY_ROLE_KEY: "Role key cannot be empty.",
  INVALID_PERMISSION_KEY_LENGTH:
    "Permission key length is outside the configured limits.",
  INVALID_ROLE_KEY_LENGTH: "Role key length is outside the configured limits.",
  INVALID_PERMISSION_KEY_FORMAT: "Permission key does not match the configured format.",
  INVALID_ROLE_KEY_FORMAT: "Role key does not match the configured format.",
})
