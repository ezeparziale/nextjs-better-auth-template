import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import CreatePermissionButton from "./_components/create-permission-button"
import { PermissionsProvider } from "./_components/permissions-context"
import PermissionsTable from "./_components/permissions-table"

const PAGE = {
  title: "Permissions",
  description: "Manage permissions",
  callbackUrl: "/admin/permissions",
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

export default async function PermissionsPage(props: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        actions={[<CreatePermissionButton key="action-create-permission" />]}
        mobileActionsBelow={false}
      />
      <PermissionsProvider>
        <PermissionsTable initialParams={searchParams} />
      </PermissionsProvider>
    </div>
  )
}
