import { notFound } from "next/navigation"
import { NavItem } from "@/types/types"
import { PageHeader } from "@/components/page-header"
import { SidebarNav } from "@/components/section-sidebar-nav"
import DeletePermissionButton from "../_components/delete-permission-button"
import { getPermission } from "./get-permission"

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
  ]
}

type Params = Promise<{ permissionId: string }>

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const permissionId = (await params).permissionId

  const sidebarNavItems = getSideBarNavItems(permissionId)

  const permission = await getPermission(permissionId)

  if (!permission) return notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${permission.name}`}
        description={`ID: ${permission.id}`}
        actions={
          <DeletePermissionButton
            permissionId={permission.id}
            permissionKey={permission.key}
          />
        }
        divider
        backLink="/admin/permissions"
      />
      <div className="flex flex-col gap-6 md:flex-row">
        <SidebarNav items={sidebarNavItems} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
