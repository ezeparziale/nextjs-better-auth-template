import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import EditPermissionRolesForm from "../_components/edit-permission-roles-form"

const PAGE = {
  title: "Manage permission roles",
  description: "Assign or remove roles from this permission.",
  callbackUrl: "/admin/permissions",
  section: "roles",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ permissionId: string }>

export default async function RolesPermissionAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { permissionId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${permissionId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const { options: rolesOptions } = await auth.api.getRolesOptions({
    query: {},
    headers: await headers(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditPermissionRolesForm
        permissionId={permissionId}
        rolesOptions={rolesOptions}
      />
    </div>
  )
}
