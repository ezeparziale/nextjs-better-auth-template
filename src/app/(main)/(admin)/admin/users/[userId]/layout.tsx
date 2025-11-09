import { NavItem } from "@/types/types"
import { PageHeader } from "@/components/page-header"
import { SidebarNav } from "@/components/section-sidebar-nav"
import DeleteUserButton from "../_components/delete-user-button"
import { getUser } from "./get-user"

const getSideBarNavItems = (id: string): NavItem[] => {
  const baseHref = `/admin/users/${id}`

  return [
    {
      name: "Settings",
      href: `${baseHref}/settings`,
    },
    {
      name: "Sessions",
      href: `${baseHref}/sessions`,
    },
    {
      name: "Actions",
      href: `${baseHref}/actions`,
    },
    {
      name: "Logs",
      href: `${baseHref}/logs`,
    },
  ]
}

type Params = Promise<{ userId: string }>

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const userId = (await params).userId

  const sidebarNavItems = getSideBarNavItems(userId)

  const user = await getUser(userId)

  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${user.email}`}
        description={`ID: ${user.id}`}
        actions={<DeleteUserButton userId={user.id} userEmail={user.email} />}
        divider
        backLink="/admin/users"
      />
      <div className="flex flex-col gap-6 md:flex-row">
        <SidebarNav items={sidebarNavItems} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
