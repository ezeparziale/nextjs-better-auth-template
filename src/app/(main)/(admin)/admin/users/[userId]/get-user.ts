import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function getUser(userId: string) {
  const user = await auth.api.getUser({
    query: { id: userId },
    headers: await headers(),
  })

  return user
}
