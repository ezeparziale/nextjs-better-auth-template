"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { useDataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const inviteUserSchema = z.object({
  email: z.email("Invalid email address").min(1, "Email is required"),
  expiresInDays: z
    .number()
    .int("Expiry must be a whole number")
    .positive("Expiry must be greater than 0")
    .max(365, "Expiry must be 365 days or less"),
})

type FormData = z.infer<typeof inviteUserSchema>

interface InviteUserDialogProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function InviteUserDialog({ isOpen, setIsOpen }: InviteUserDialogProps) {
  const { refreshTable } = useDataTable()
  const form = useForm<FormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      expiresInDays: 30,
    },
    mode: "onChange",
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await authClient.invitation.create({
        email: values.email,
        expiresInDays: values.expiresInDays,
      })

      if (error) {
        toast.error(error.message || "Failed to send invitation")
        return
      }

      toast.success(`Invitation sent to ${values.email}`)
      setIsOpen(false)
      form.reset()
      refreshTable({ resetPagination: false })
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting } = form.formState

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send an invitation to a user to join the application.
          </DialogDescription>
        </DialogHeader>
        <form id="form-invite-user" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="user@example.com"
                    type="email"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="expiresInDays"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Expires in (days)</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min={1}
                    max={365}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value),
                      )
                    }
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  <FieldDescription>
                    The invitation will expire after this many days. Defaults to 30.
                  </FieldDescription>
                </Field>
              )}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="form-invite-user" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
