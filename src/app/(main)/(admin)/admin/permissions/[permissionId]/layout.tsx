import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NavItem } from "@/types/types"
import { auth } from "@/lib/auth/auth"
import { getPermission } from "@/data/auth/get-permission"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import { SidebarNav } from "@/components/section-sidebar-nav"
import DeletePermissionButton from "../_components/delete-permission-button"

const getSideBarNavItems = (id: string): NavItem[] => {
  const baseHref = `/admin/permissions/${id}`

  return [
    {
      name: "Settings",
      href: `${baseHref}/settings`,
    },
    {
      name: "Roles",
      href: `${baseHref}/roles`,
    },
    {
      name: "Logs",
      href: `${baseHref}/logs`,
    },
  ]
}

type Params = Promise<{ permissionId: string }>

export default async function PermissionAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const permissionId = (await params).permissionId

  const sidebarNavItems = getSideBarNavItems(permissionId)

  const permission = await getPermission(permissionId)

  if (session && !permission) return notFound()

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={`Edit ${permission?.name}`}
          description={`ID: ${permission?.id}`}
          actions={
            <DeletePermissionButton
              permissionId={permission?.id ?? ""}
              permissionKey={permission?.key ?? ""}
            />
          }
          divider
          backLink="/admin/permissions"
        />
        <div className="flex flex-col gap-6 md:flex-row">
          <SidebarNav items={sidebarNavItems} />
          <div className="flex-1">{children}</div>
        </div>
      </DataTableProvider>
    </div>
  )
}
