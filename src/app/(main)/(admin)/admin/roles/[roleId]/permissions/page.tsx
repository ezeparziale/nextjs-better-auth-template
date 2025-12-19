import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { DataTableProvider } from "@/components/ui/data-table"
import RolePermissionsClient from "./_components/role-permissions-client"

const PAGE = {
  title: "Manage role permissions",
  description: "Assign or remove permissions from this role.",
  callbackUrl: "/admin/roles",
  section: "permissions",
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

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${roleId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <RolePermissionsClient
          roleId={roleId}
          page={PAGE}
          initialParams={searchParams}
        />
      </DataTableProvider>
    </div>
  )
}
