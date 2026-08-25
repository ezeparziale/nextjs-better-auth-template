export const PERMISSION_KEY_PATTERN = /^[a-z0-9_-]+\.[a-z0-9_-]+$/i

export const PERMISSION_KEY_ERROR_MESSAGE =
  'Permission key must follow the format "feature.action" (e.g., "user.read").'

export const PERMISSION_KEY_EXAMPLE = "posts.create"

export const ROLE_KEY_PATTERN = /^[a-z0-9_]+$/

export const ROLE_KEY_ERROR_MESSAGE =
  'Role key can only contain lowercase letters, numbers and underscores (e.g., "content_manager").'

export const ROLE_KEY_EXAMPLE = "content_manager"
