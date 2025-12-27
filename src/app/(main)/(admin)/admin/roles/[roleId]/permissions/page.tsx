import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddPermissionDialog from "./_components/add-permission-dialog"
import RolePermissionsTable from "./_components/role-permissions-table"

const PAGE = {
  title: "Manage role permissions",
  description: "Assign or remove permissions from this role.",
  getCallbackUrl: (roleId: string) => `/admin/roles/${roleId}/permissions`,
}

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

type Params = Promise<{ roleId: string }>

export default async function PermissionsRoleAdminPage(props: {
  params: Params
  searchParams: SearchParams
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { roleId } = await props.params

  if (!session) redirect(`/login?callbackUrl=${PAGE.getCallbackUrl(roleId)}`)

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
            <AddPermissionDialog roleId={roleId} key="btn-action-add-permission" />,
          ]}
        />
        <RolePermissionsTable roleId={roleId} initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
