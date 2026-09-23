"use client"

import { authClient } from "@/lib/auth/auth-client"
import { useDataTable } from "@/components/ui/data-table"
import type { MultiSelectAsyncOption } from "@/components/ui/multi-select-async"
import AssignItemsDialog from "@/components/assign-items-dialog"

interface AddPermissionDialogProps {
  roleId: string
  isSystem?: boolean
}

const LIMIT = 5

export default function AddPermissionDialog({
  roleId,
  isSystem = false,
}: AddPermissionDialogProps) {
  const { refreshTable } = useDataTable()

  const fetchAssignedPermissions = async (roleId: string) => {
    const allPermissions: Array<{ id: string; name: string }> = []
    let page = 0
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const assignedRes = await authClient.rbac.getRolePermissions({
        query: {
          roleId,
          limit: pageSize,
          offset: page * pageSize,
        },
      })

      if (
        assignedRes.data?.data.permissions &&
        assignedRes.data.data.permissions.length > 0
      ) {
        allPermissions.push(...assignedRes.data.data.permissions)

        if (assignedRes.data.data.permissions.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    return allPermissions
  }

  const fetchAvailablePermissions = async (
    search: string,
  ): Promise<MultiSelectAsyncOption[]> => {
    const params: { search?: string; limit?: number } = {}

    if (search) {
      params.search = search
    }

    params.limit = LIMIT

    const response = await authClient.rbac.getPermissionsOptions({ query: params })

    if (response.data?.options) {
      return response.data.options.map((option) => ({
        value: option.value,
        label: option.label,
        subtitle: option.key,
      }))
    }

    return []
  }

  const updatePermissions = async (roleId: string, permissionIds: string[]) => {
    const result = await authClient.rbac.updateRole({
      id: roleId,
      permissionIds,
    })

    return {
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  return (
    <AssignItemsDialog
      resourceId={roleId}
      title="Manage permissions"
      description="Add or remove permissions for this role."
      fieldLabel="Permissions"
      placeholder="Select permissions"
      searchPlaceholder="Search permissions by name or key…"
      emptyMessage="No permissions found."
      buttonText="Manage permissions"
      disabled={isSystem}
      fetchAssignedItems={fetchAssignedPermissions}
      fetchAvailableItems={fetchAvailablePermissions}
      updateItems={updatePermissions}
      onItemsUpdated={refreshTable}
      messages={{
        success: "Permissions updated successfully",
        error: "Failed to update permissions",
        loadError: "Failed to load permissions",
      }}
    />
  )
}
