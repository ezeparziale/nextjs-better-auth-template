import NotFound404 from "@/components/404"

export default function RoleNotFound() {
  return (
    <NotFound404 message="Role not found" linkText="Go to roles" link="/admin/roles" />
  )
}
