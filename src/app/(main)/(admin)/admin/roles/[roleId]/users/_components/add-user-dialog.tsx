"use client"

import { authClient } from "@/lib/auth/auth-client"
import { useDataTable } from "@/components/ui/data-table"
import type { MultiSelectAsyncOption } from "@/components/ui/multi-select-async"
import AssignItemsDialog from "@/components/assign-items-dialog"

interface AddUserDialogProps {
  roleId: string
}

const LIMIT = 5

export default function AddUserDialog({ roleId }: AddUserDialogProps) {
  const { refreshTable } = useDataTable()

  const fetchAssignedUsers = async (roleId: string) => {
    const allUsers: Array<{ id: string; name: string }> = []
    let page = 0
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const assignedRes = await authClient.rbac.getRoleUsers({
        query: {
          roleId,
          limit: pageSize,
          offset: page * pageSize,
        },
      })

      if (assignedRes.data?.users && assignedRes.data.users.length > 0) {
        // Users tienen email en lugar de name
        allUsers.push(
          ...assignedRes.data.users.map((user) => ({
            id: user.id,
            name: user.email, // usamos email como nombre
          })),
        )

        if (assignedRes.data.users.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    return allUsers
  }

  const fetchAvailableUsers = async (
    search: string,
  ): Promise<MultiSelectAsyncOption[]> => {
    const params: { search?: string; limit?: number } = {}

    if (search) {
      params.search = search
    }

    params.limit = LIMIT

    const response = await authClient.rbac.getUsersOptions({ query: params })

    if (response.data?.options) {
      return response.data.options.map((option) => ({
        value: option.value,
        label: option.label,
      }))
    }

    return []
  }

  const updateUsers = async (roleId: string, userIds: string[]) => {
    const result = await authClient.rbac.updateRole({
      id: roleId,
      userIds,
    })

    return {
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  return (
    <AssignItemsDialog
      resourceId={roleId}
      title="Manage users"
      description="Add or remove users for this role."
      fieldLabel="Users"
      placeholder="Select users"
      searchPlaceholder="Search users…"
      emptyMessage="No users found."
      buttonText="Manage users"
      fetchAssignedItems={fetchAssignedUsers}
      fetchAvailableItems={fetchAvailableUsers}
      updateItems={updateUsers}
      onItemsUpdated={refreshTable}
      messages={{
        success: "Users updated successfully",
        error: "Failed to update users",
        loadError: "Failed to load users",
      }}
    />
  )
}
