"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
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

const editPermissionRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

type FormData = z.infer<typeof editPermissionRolesSchema>

type Option = {
  value: string
  label: string
}

export default function EditPermissionRolesForm({
  permissionId,
  rolesOptions,
}: {
  permissionId: string
  rolesOptions: Option[]
}) {
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(editPermissionRolesSchema),
    defaultValues: { roleIds: [] },
  })

  // Fetch current roles for the permission
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await authClient.rbac.getPermissionRoles({
          query: { permissionId },
        })

        if (error) {
          toast.error(error.message || "Failed to load roles")
          return
        }

        if (data.roles) {
          form.setValue(
            "roleIds",
            data.roles.map((r) => r.id),
          )
          form.reset({
            roleIds: data.roles.map((r) => r.id),
          })
        }
      } catch {
        toast.error("Something went wrong while fetching roles")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.rbac.updatePermission({
        id: permissionId,
        roleIds: values.roleIds,
      })

      if (error) {
        toast.error(error.message || "Failed to update roles")
      } else {
        toast.success("Roles updated successfully")
        form.reset({ roleIds: values.roleIds })
      }
    } catch {
      toast.error("Something went wrong while saving roles")
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
        <form id="form-edit-permission-roles" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="w-full md:w-2/3">
            <Controller
              name="roleIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Roles</FieldLabel>
                  <MultiSelect
                    {...field}
                    values={field.value}
                    onValuesChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <MultiSelectTrigger className="w-full max-w-[400px]">
                      <MultiSelectValue placeholder="Select roles..." />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {rolesOptions.map((option) => (
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
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                form="form-edit-permission-roles"
                className="w-full md:w-1/5"
                disabled={isSubmitting || !isDirty}
                size="sm"
              >
                {isSubmitting && <Spinner />} Save
              </Button>
              <Button size="sm" className="w-full md:w-1/5" variant="outline" asChild>
                <Link href="/admin/permissions">Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
