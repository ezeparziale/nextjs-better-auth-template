import { notFound } from "next/navigation"
import { LockIcon } from "lucide-react"
import { NavItem } from "@/types/types"
import { requireAdmin } from "@/lib/auth/guards"
import { getPermission } from "@/data/auth/get-permission"
import { Badge } from "@/components/ui/badge"
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
  await requireAdmin()

  const permissionId = (await params).permissionId

  const sidebarNavItems = getSideBarNavItems(permissionId)

  const permission = await getPermission(permissionId)

  if (!permission) return notFound()

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={`Edit ${permission?.name}`}
          tags={
            permission.isSystem ? (
              <Badge variant="outline" className="gap-1">
                <LockIcon />
                System
              </Badge>
            ) : undefined
          }
          description={`ID: ${permission?.id}`}
          copyValue={permission?.id}
          actions={
            !permission.isSystem ? (
              <DeletePermissionButton
                permissionId={permission.id}
                permissionKey={permission.key}
              />
            ) : undefined
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
