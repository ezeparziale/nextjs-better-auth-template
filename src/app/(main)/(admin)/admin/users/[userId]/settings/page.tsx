import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import EditUserForm from "../_components/edit-user-form"
import { getUser } from "../get-user"

const PAGE = {
  title: "Edit user",
  description: "Edit the user's settings.",
  callbackUrl: "/admin/users",
  section: "settings",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function NewUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const user = await getUser(userId)

  if (!user) return notFound()

  const userDTO = {
    id: user.id,
    name: user.name,
    email: user.email,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditUserForm user={userDTO} />
    </div>
  )
}
