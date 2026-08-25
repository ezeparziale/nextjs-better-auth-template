import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
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
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const user = await getUser(userId)

  if (!user) return notFound()

  const userDTO = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
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
