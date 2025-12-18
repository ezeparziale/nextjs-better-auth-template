import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import EditUserForm from "./_components/edit-user-form"

const PAGE = {
  title: "User settings",
  description: "Manage user settings and information.",
  callbackUrl: "/admin/users",
  section: "settings",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function SettingsUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

  const user = await getUser(userId)

  if (!user) return notFound()

  const userDTO = {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    phone: user.phone,
    websiteUrl: user.websiteUrl,
    linkedinUrl: user.linkedinUrl,
    githubUrl: user.githubUrl,
    xUrl: user.xUrl,
    jobTitle: user.jobTitle,
    company: user.company,
    department: user.department,
    location: user.location,
  }

  return (
    <div className="space-y-6">
      <EditUserForm user={userDTO} />
    </div>
  )
}
