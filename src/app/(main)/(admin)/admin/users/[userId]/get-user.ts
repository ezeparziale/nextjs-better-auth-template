import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function getUser(userId: string) {
  try {
    const user = await auth.api.getUser({
      query: { id: userId },
      headers: await headers(),
    })
    return user
  } catch (error) {
    console.error(`User not found: ${userId}`, error)
    return null
  }
}
