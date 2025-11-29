import { notFound } from "next/navigation"
import { NavItem } from "@/types/types"
import { getRole } from "@/data/auth/get-role"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import { SidebarNav } from "@/components/section-sidebar-nav"
import DeleteRoleButton from "../_components/delete-role-button"

const getSideBarNavItems = (id: string): NavItem[] => {
  const baseHref = `/admin/roles/${id}`

  return [
    {
      name: "Settings",
      href: `${baseHref}/settings`,
    },
    {
      name: "Permissions",
      href: `${baseHref}/permissions`,
    },
    { name: "Logs", href: `${baseHref}/logs` },
  ]
}

type Params = Promise<{ roleId: string }>

export default async function RoleAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const roleId = (await params).roleId

  const sidebarNavItems = getSideBarNavItems(roleId)

  const role = await getRole(roleId)

  if (!role) return notFound()

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={`Edit ${role.name}`}
          description={`ID: ${role.id}`}
          actions={<DeleteRoleButton roleId={role.id} roleKey={role.key} />}
          divider
          backLink="/admin/roles"
        />
        <div className="flex flex-col gap-6 md:flex-row">
          <SidebarNav items={sidebarNavItems} />
          <div className="flex-1">{children}</div>
        </div>
      </DataTableProvider>
    </div>
  )
}
