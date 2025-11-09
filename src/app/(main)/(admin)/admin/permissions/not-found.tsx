import NotFound404 from "@/components/404"

export default function PermissionNotFound() {
  return (
    <NotFound404
      message="Permission not found"
      linkText="Go to permissions"
      link="/admin/permissions"
    />
  )
}
