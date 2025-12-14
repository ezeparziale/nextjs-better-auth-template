"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Option } from "@/types/types"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

const editRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

type FormData = z.infer<typeof editRolePermissionsSchema>

export default function EditRolePermissionsForm({
  roleId,
  permissionsOptions,
}: {
  roleId: string
  permissionsOptions: Option[]
}) {
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(editRolePermissionsSchema),
    defaultValues: { permissionIds: [] },
  })

  // Fetch current roles for the permission
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await authClient.rbac.getRolePermissions({
          query: { roleId },
        })

        if (error) {
          toast.error(error.message || "Failed to load permissions")
          return
        }

        if (data.permissions) {
          form.setValue(
            "permissionIds",
            data.permissions.map((r) => r.id),
          )
          form.reset({
            permissionIds: data.permissions.map((r) => r.id),
          })
        }
      } catch {
        toast.error("Something went wrong while fetching permissions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.rbac.updateRole({
        id: roleId,
        permissionIds: values.permissionIds,
      })

      if (error) {
        toast.error(error.message || "Failed to update permissions")
      } else {
        toast.success("Permissions updated successfully")
        form.reset({ permissionIds: values.permissionIds })
      }
    } catch {
      toast.error("Something went wrong while saving permissions")
    }
  }

  const { isSubmitting, isDirty } = form.formState

  if (isLoading)
    return (
      <Card>
        <CardContent>
          <div className="w-full md:w-2/3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full max-w-[400px]" />
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-9 w-full md:w-1/5" />
              <Skeleton className="h-9 w-full md:w-1/5" />
            </div>
          </div>
        </CardContent>
      </Card>
    )

  return (
    <Card>
      <CardContent>
        <form id="form-edit-role-permissions" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="w-full md:w-2/3">
            <Controller
              name="permissionIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Permissions</FieldLabel>
                  <MultiSelect
                    {...field}
                    values={field.value}
                    onValuesChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <MultiSelectTrigger className="w-full max-w-[400px]">
                      <MultiSelectValue placeholder="Select permissions..." />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {permissionsOptions.map((option) => (
                        <MultiSelectItem value={option.value} key={option.value}>
                          {option.label}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectContent>
                  </MultiSelect>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="mt-6 flex flex-col gap-4 md:flex-row">
              <Button
                type="submit"
                form="form-edit-role-permissions"
                className="w-full md:w-32"
                disabled={isSubmitting || !isDirty}
                size="sm"
              >
                {isSubmitting && <Spinner />} Save
              </Button>
              <Button size="sm" className="w-full md:w-32" variant="outline" asChild>
                <Link href="/admin/roles">Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
