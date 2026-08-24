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
      website_url: true,
      linkedin_url: true,
      github_url: true,
      x_url: true,
      job_title: true,
      company: true,
      department: true,
      location: true,
    },
  })

  if (!user) return null

  return {
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    bio: user.bio,
    phone: user.phone,
    websiteUrl: user.website_url,
    linkedinUrl: user.linkedin_url,
    githubUrl: user.github_url,
    xUrl: user.x_url,
    jobTitle: user.job_title,
    company: user.company,
    department: user.department,
    location: user.location,
  }
}
