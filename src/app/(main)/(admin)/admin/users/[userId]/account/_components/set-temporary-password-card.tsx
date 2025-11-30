"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const updatePasswordSchema = z.object({
  newPassword: z.string().min(1, "Password must be at least 8 characters long"),
})

type FormData = z.infer<typeof updatePasswordSchema>

export function SetTemporaryPasswordCard({ userId }: { userId: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  })

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.adminPlus.setCredentialPassword({
        newPassword: values.newPassword,
        userId,
      })

      if (error) {
        if (error.code === "PASSWORD_TOO_SHORT" || error.code === "PASSWORD_TOO_LONG") {
          form.setError("newPassword", {
            type: "custom",
            message: error.message,
          })
        }
        toast.error(
          error.message || "Failed to set temporary password. Please try again.",
        )
        return
      }

      setIsOpen(false)
      form.reset()
      toast.success("Temporary password has been set successfully!")
      router.refresh()
    } catch {
      toast.error("Failed to set temporary password. Please try again.")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    form.reset()
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Set temporary password</CardTitle>
        <CardDescription>Set a temporary password for the user</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set temporary password</DialogTitle>
              <DialogDescription>
                Enter a temporary password for the user.
              </DialogDescription>
            </DialogHeader>
            <form id="form-set-password" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        disabled={isSubmitting}
                        autoComplete="false"
                        type="password"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
            <DialogFooter className="gap-y-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="form-set-password"
                disabled={isSubmitting || !isDirty}
              >
                {isSubmitting && <Spinner />} Set password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-between rounded-b-xl border-t py-4!">
        <CardDescription>
          This action will remove all sessions from the user.
        </CardDescription>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          aria-label="Set temporary password"
        >
          Set temporary password
        </Button>
      </CardFooter>
    </Card>
  )
}
