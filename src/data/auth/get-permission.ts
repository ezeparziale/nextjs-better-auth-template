import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"

export async function getPermission(permissionId: string) {
  try {
    const { permission } = await auth.api.getPermission({
      query: { id: permissionId },
      headers: await headers(),
    })
    return permission
  } catch (error) {
    console.error(`Permission not found: ${permissionId}`, error)
    return null
  }
}
