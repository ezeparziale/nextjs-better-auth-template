import type { Metadata } from "next"
import { redirect } from "next/navigation"

const PAGE = {
  title: "Edit permission",
  description: "Edit the permission's settings.",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ permissionId: string }>

export default async function PermissionAdminPage(props: { params: Params }) {
  const params = await props.params
  const permissionId = params.permissionId

  redirect(`/admin/permissions/${permissionId}/settings`)
}
