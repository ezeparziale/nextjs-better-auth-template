import { db } from "@/lib/db"

export async function getUserSettings(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      bio: true,
      phone: true,
      websiteUrl: true,
      linkedinUrl: true,
      githubUrl: true,
      xUrl: true,
      jobTitle: true,
      company: true,
      department: true,
      location: true,
    },
  })

  return user
}
