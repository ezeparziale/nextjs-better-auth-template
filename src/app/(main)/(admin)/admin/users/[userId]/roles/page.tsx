import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import { PageHeader } from "@/components/page-header"
import EditUserRolesForm from "./_components/edit-user-roles-form"

const PAGE = {
  title: "User roles",
  description: "Manage user roles.",
  callbackUrl: "/admin/users",
  section: "roles",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function RolesUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

  const user = await getUser(userId)

  if (!user) return notFound()

  const { options: rolesOptions } = await auth.api.getRolesOptions({
    query: {},
    headers: await headers(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditUserRolesForm userId={userId} rolesOptions={rolesOptions} />
    </div>
  )
}
