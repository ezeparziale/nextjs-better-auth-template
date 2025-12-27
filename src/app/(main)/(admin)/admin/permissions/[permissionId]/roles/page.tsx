import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddRoleDialog from "./_components/add-role-dialog"
import PermissionRolesTable from "./_components/permission-roles-table"

const PAGE = {
  title: "Manage permission roles",
  description: "Assign or remove roles from this permission.",
  getCallbackUrl: (permissionId: string) => `/admin/permissions/${permissionId}/roles`,
} as const

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}
type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

type Params = Promise<{ permissionId: string }>

export default async function RolesPermissionAdminPage(props: {
  params: Params
  searchParams: SearchParams
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { permissionId } = await props.params

  if (!session) redirect(`/login?callbackUrl=${PAGE.getCallbackUrl(permissionId)}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={PAGE.title}
          description={PAGE.description}
          isSection
          actions={[
            <AddRoleDialog permissionId={permissionId} key="btn-action-add-role" />,
          ]}
        />
        <PermissionRolesTable
          permissionId={permissionId}
          initialParams={searchParams}
        />
      </DataTableProvider>
    </div>
  )
}
