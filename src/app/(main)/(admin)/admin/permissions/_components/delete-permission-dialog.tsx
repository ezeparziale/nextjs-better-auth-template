import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { emitPermissionsRefresh } from "./events"

export default function DeletePermissionDialog({
  permissionId,
  permissionKey,
  isOpen,
  setIsOpen,
  goToTableAfterDelete = false,
}: {
  permissionId: string
  permissionKey: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  goToTableAfterDelete?: boolean
}) {
  const router = useRouter()
  const formSchema = z.object({
    confirmString: z.literal(permissionKey, {
      error: "Incorrect permission key",
    }),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    defaultValues: { confirmString: "" },
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async () => {
    try {
      const { data: deletedUser, error } = await authClient.rbac.deletePermission({
        id: permissionId,
      })

      if (error) {
        toast.error(error.message || "Something went wrong")
        return
      }

      if (deletedUser.success) {
        toast.success("Permission deleted successfully!")
        setIsOpen(false)
        if (goToTableAfterDelete) {
          router.push("/admin/permissions")
          return
        }
        emitPermissionsRefresh()
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
          <DialogTitle>Delete permission?</DialogTitle>
          <DialogDescription>
            This action is permanent and could result in users losing access to your
            application.
          </DialogDescription>
        </DialogHeader>
        <form id="form-delete-permission" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="confirmString"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Enter{" "}
                    <span className="bg-accent px-1 font-mono">{permissionKey}</span>
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
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            form="form-delete-permission"
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting && <Spinner />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
