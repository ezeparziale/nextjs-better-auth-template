"use client"

import { authClient } from "@/lib/auth/auth-client"
import { useDataTable } from "@/components/ui/data-table"
import type { MultiSelectAsyncOption } from "@/components/ui/multi-select-async"
import AssignItemsDialog from "@/components/assign-items-dialog"

interface AddRoleDialogProps {
  permissionId: string
}

const LIMIT = 5

export default function AddRoleDialog({ permissionId }: AddRoleDialogProps) {
  const { refreshTable } = useDataTable()

  const fetchAssignedRoles = async (permissionId: string) => {
    const allRoles: Array<{ id: string; name: string }> = []
    let page = 0
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const assignedRes = await authClient.rbac.getPermissionRoles({
        query: {
          permissionId,
          limit: pageSize,
          offset: page * pageSize,
        },
      })

      if (assignedRes.data?.roles && assignedRes.data.roles.length > 0) {
        allRoles.push(...assignedRes.data.roles)

        if (assignedRes.data.roles.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    return allRoles
  }

  const fetchAvailableRoles = async (
    search: string,
  ): Promise<MultiSelectAsyncOption[]> => {
    const params: { search?: string; limit?: number } = {}

    if (search) {
      params.search = search
    }

    params.limit = LIMIT

    const response = await authClient.rbac.getRolesOptions({ query: params })

    if (response.data?.options) {
      return response.data.options.map((option) => ({
        value: option.value,
        label: option.label,
      }))
    }

    return []
  }

  const updateRoles = async (permissionId: string, roleIds: string[]) => {
    const result = await authClient.rbac.updatePermission({
      id: permissionId,
      roleIds,
    })

    return {
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  return (
    <AssignItemsDialog
      resourceId={permissionId}
      title="Manage roles"
      description="Add or remove roles for this permission."
      fieldLabel="Roles"
      placeholder="Select roles"
      searchPlaceholder="Search roles…"
      emptyMessage="No roles found."
      buttonText="Manage roles"
      fetchAssignedItems={fetchAssignedRoles}
      fetchAvailableItems={fetchAvailableRoles}
      updateItems={updateRoles}
      onItemsUpdated={refreshTable}
      messages={{
        success: "Roles updated successfully",
        error: "Failed to update roles",
        loadError: "Failed to load roles",
      }}
    />
  )
}
