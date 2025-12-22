"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  MultiSelectAsync,
  MultiSelectAsyncContent,
  MultiSelectAsyncTrigger,
  MultiSelectAsyncValue,
  type MultiSelectAsyncOption,
} from "@/components/ui/multi-select-async"
import { Spinner } from "@/components/ui/spinner"

const addUserSchema = z.object({
  userIds: z.array(z.string()),
})

type FormData = z.infer<typeof addUserSchema>

interface AddUserDialogProps {
  roleId: string
  onUserAdded: (options?: { resetPagination?: boolean }) => void
}

const LIMIT = 5

export default function AddUserDialog({ roleId, onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false)
  const [selectedUsersCache, setSelectedUsersCache] = useState<
    Map<string, MultiSelectAsyncOption>
  >(new Map())

  const form = useForm<FormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      userIds: [],
    },
  })

  // Fetch function for async multi-select
  const fetchUsers = async (search: string): Promise<MultiSelectAsyncOption[]> => {
    try {
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
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
      return []
    }
  }

  // Load assigned users when dialog opens
  useEffect(() => {
    if (open) {
      const fetchAssignedUsers = async () => {
        setIsLoadingAssigned(true)
        try {
          const allUsers: Array<{ id: string; email: string }> = []
          let page = 0
          const pageSize = 10000
          let hasMore = true

          // Fetch all users in pages of 10000
          while (hasMore) {
            const assignedRes = await authClient.rbac.getRoleUsers({
              query: {
                roleId,
                limit: pageSize,
                offset: page * pageSize,
              },
            })

            if (assignedRes.data?.users && assignedRes.data.users.length > 0) {
              allUsers.push(...assignedRes.data.users)

              // Check if there are more pages
              if (assignedRes.data.users.length < pageSize) {
                hasMore = false
              } else {
                page++
              }
            } else {
              hasMore = false
            }
          }

          if (allUsers.length > 0) {
            const userIds = allUsers.map((u) => u.id)

            // Pre-load the selected users' labels into cache
            const selectedOptions = allUsers.map((user) => ({
              value: user.id,
              label: user.email,
            }))

            const newCache = new Map<string, MultiSelectAsyncOption>()
            selectedOptions.forEach((option) => {
              newCache.set(option.value, option)
            })
            setSelectedUsersCache(newCache)

            form.reset({
              userIds,
            })
          }
        } catch {
          toast.error("Failed to load assigned users")
        } finally {
          setIsLoadingAssigned(false)
        }
      }
      fetchAssignedUsers()
    } else {
      form.reset({ userIds: [] })
      setSelectedUsersCache(new Map())
    }
  }, [open, roleId, form])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await authClient.rbac.updateRole({
        id: roleId,
        userIds: values.userIds,
      })

      if (error) {
        toast.error(error.message || "Failed to update users")
      } else {
        toast.success("Users updated successfully")
        handleOpenChange(false)
        onUserAdded({ resetPagination: true })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          Manage users
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage users</DialogTitle>
          <DialogDescription>Add or remove users for this role.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="py-4">
            <Controller
              name="userIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel>Users</FieldLabel>
                  <MultiSelectAsync
                    values={field.value}
                    onValuesChange={field.onChange}
                    disabled={isLoadingAssigned}
                    fetchOptions={fetchUsers}
                    initialLimit={LIMIT}
                    debounceMs={300}
                    preloadedOptions={Array.from(selectedUsersCache.values())}
                  >
                    <MultiSelectAsyncTrigger className="w-full">
                      <MultiSelectAsyncValue
                        placeholder={isLoadingAssigned ? "Loading..." : "Select users"}
                        overflowBehavior="wrap"
                      />
                    </MultiSelectAsyncTrigger>
                    <MultiSelectAsyncContent
                      searchPlaceholder="Search users..."
                      emptyMessage="No users found."
                    />
                  </MultiSelectAsync>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoadingAssigned || isSubmitting || !isDirty}
            >
              {isSubmitting && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
