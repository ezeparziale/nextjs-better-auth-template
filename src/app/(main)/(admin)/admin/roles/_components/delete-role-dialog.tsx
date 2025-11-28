import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { useDataTable } from "@/components/ui/data-table/data-table-provider"
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

export default function DeleteRoleDialog({
  roleId,
  roleKey,
  isOpen,
  setIsOpen,
  goToTableAfterDelete = false,
}: {
  roleId: string
  roleKey: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  goToTableAfterDelete?: boolean
}) {
  const router = useRouter()
  const { refreshTable } = useDataTable()
  const formSchema = z.object({
    confirmString: z.literal(roleKey, {
      error: "Incorrect role key",
    }),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    defaultValues: { confirmString: "" },
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async () => {
    try {
      const { data: deletedUser, error } = await authClient.rbac.deleteRole({
        id: roleId,
      })

      if (error) {
        toast.error(error.message || "Something went wrong")
        return
      }

      if (deletedUser.success) {
        toast.success("Role deleted successfully!")
        setIsOpen(false)
        if (goToTableAfterDelete) {
          router.push("/admin/roles")
          return
        }
        refreshTable({ resetPagination: true })
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
          <DialogTitle>Delete role?</DialogTitle>
          <DialogDescription>
            This action is permanent and could result in users losing access to your
            application.
          </DialogDescription>
        </DialogHeader>
        <form id="form-delete-role" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="confirmString"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Enter <span className="bg-accent px-1 font-mono">{roleKey}</span>
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
            form="form-delete-role"
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
