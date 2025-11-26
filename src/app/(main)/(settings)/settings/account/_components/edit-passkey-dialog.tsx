import { useRouter } from "next/navigation"
import { Passkey } from "@better-auth/passkey"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
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

const passkeySchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
})

type FormData = z.infer<typeof passkeySchema>

interface EditPasskeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  passkey: Passkey
}

export function EditPasskeyDialog({
  open,
  onOpenChange,
  passkey,
}: EditPasskeyDialogProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(passkeySchema),
    defaultValues: {
      name: passkey.name,
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: passkey.id,
        name: values.name,
      })

      if (error) {
        toast.error(error.message || "Failed to update passkey")
        return
      }

      toast.success("Passkey updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Failed to update passkey")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit passkey</DialogTitle>
          <DialogDescription>
            Update the name of your passkey to easily identify it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-6 space-y-4">
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Device name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      autoComplete="off"
                      placeholder="e.g., My desktop"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
