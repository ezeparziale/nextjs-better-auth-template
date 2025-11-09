import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import EditRolePermissionsForm from "../_components/edit-role-permissions-form"

const PAGE = {
  title: "Manage role permissions",
  description: "Assign or remove permissions from this role.",
  callbackUrl: "/admin/roles",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ roleId: string }>

export default async function PermissionsRoleAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { roleId } = await props.params

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${roleId}/permissions`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const { options: permissionsOptions } = await auth.api.getPermissionsOptions({
    query: {},
    headers: await headers(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditRolePermissionsForm
        roleId={roleId}
        permissionsOptions={permissionsOptions}
      />
    </div>
  )
}
