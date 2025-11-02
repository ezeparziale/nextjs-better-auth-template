import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { emitUsersRefresh } from "./events"

export default function DeleteUserDialog({
  userId,
  userEmail,
  isOpen,
  setIsOpen,
}: {
  userId: string
  userEmail: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const formSchema = z.object({
    confirmString: z.literal(userEmail, {
      error: "Incorrect user email",
    }),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    defaultValues: { confirmString: "" },
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async () => {
    try {
      const { data: deletedUser, error } = await authClient.admin.removeUser({
        userId: userId,
      })

      if (error) {
        toast.error(error.message || "Something went wrong")
        return
      }

      if (deletedUser.success) {
        toast.success("User deleted successfully!")
        setIsOpen(false)
        emitUsersRefresh()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) form.reset()
  }

  const { isSubmitting } = form.formState

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            This action is permanent and could result in users losing access to your
            application.
          </DialogDescription>
        </DialogHeader>
        <form id="form-delete-user" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="confirmString"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Enter <span className="bg-accent px-1 font-mono">{userEmail}</span>
                    to continue.
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-delete-user" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
