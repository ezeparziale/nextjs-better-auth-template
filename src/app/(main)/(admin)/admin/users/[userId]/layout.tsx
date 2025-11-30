import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NavItem } from "@/types/types"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import { SidebarNav } from "@/components/section-sidebar-nav"
import DeleteUserButton from "../_components/delete-user-button"

const getSideBarNavItems = (id: string): NavItem[] => {
  const baseHref = `/admin/users/${id}`

  return [
    {
      name: "Settings",
      href: `${baseHref}/settings`,
    },
    {
      name: "Account",
      href: `${baseHref}/account`,
    },
    {
      name: "Sessions",
      href: `${baseHref}/sessions`,
    },
    {
      name: "Metadata",
      href: `${baseHref}/metadata`,
    },
    {
      name: "Logs",
      href: `${baseHref}/logs`,
    },
  ]
}

type Params = Promise<{ userId: string }>

export default async function UserAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userId = (await params).userId

  const sidebarNavItems = getSideBarNavItems(userId)

  const user = await getUser(userId)

  if (session && !user) return notFound()

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={`Edit ${user?.email}`}
          description={`ID: ${user?.id}`}
          actions={
            <DeleteUserButton userId={user?.id ?? ""} userEmail={user?.email ?? ""} />
          }
          divider
          backLink="/admin/users"
        />
        <div className="flex flex-col gap-6 md:flex-row">
          <SidebarNav items={sidebarNavItems} />
          <div className="flex-1">{children}</div>
        </div>
      </DataTableProvider>
    </div>
  )
}
