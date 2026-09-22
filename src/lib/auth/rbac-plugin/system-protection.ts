export type SystemProtectionMode = "strict" | "allow_metadata_edit"

/**
 * Single source of truth for the RBAC system protection mode. Imported both by
 * the server plugin config and by the client settings forms so the UI always
 * reflects what the server enforces.
 *
 * - `"strict"`: System roles and permissions cannot be updated (name,
 *   description, key, isActive) or deleted.
 * - `"allow_metadata_edit"`: `name` and `description` can be updated; `key`,
 *   `isActive` and deletion remain prohibited.
 */
export const SYSTEM_PROTECTION_MODE: SystemProtectionMode = "strict"
