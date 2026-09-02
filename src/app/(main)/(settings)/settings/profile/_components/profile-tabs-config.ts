export type ProfileTab = "profile" | "social" | "job"

export const TAB_PARAM = "tab"

export const TAB_DEFINITIONS: { value: ProfileTab; label: string }[] = [
  { value: "profile", label: "Profile" },
  { value: "social", label: "Social" },
  { value: "job", label: "Job" },
]

export function isProfileTab(value: string | undefined): value is ProfileTab {
  return value === "profile" || value === "social" || value === "job"
}
