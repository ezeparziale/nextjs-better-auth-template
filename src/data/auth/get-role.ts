import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"

export async function getRole(roleId: string) {
  try {
    const { role } = await auth.api.rbacGetRole({
      query: { id: roleId },
      headers: await headers(),
    })
    return role
  } catch (error) {
    console.error(`Permission not found: ${roleId}`, error)
    return null
  }
}
