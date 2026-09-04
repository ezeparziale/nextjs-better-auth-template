export type AdminUsersTab = "users" | "invitations"

export const TAB_PARAM = "tab"

export const TAB_DEFINITIONS: { value: AdminUsersTab; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "invitations", label: "Invitations" },
]

export function isAdminUsersTab(value: string | undefined): value is AdminUsersTab {
  return value === "users" || value === "invitations"
}
