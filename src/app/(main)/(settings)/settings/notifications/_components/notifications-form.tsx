"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient, useSession } from "@/lib/auth/auth-client"
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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

const schema = z.object({
  notificationNewLoginEmail: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface NotificationsFormProps {
  notificationNewLoginEmail: boolean
}

export default function NotificationsForm({
  notificationNewLoginEmail,
}: NotificationsFormProps) {
  const router = useRouter()
  const { refetch } = useSession()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      notificationNewLoginEmail,
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      console.log(values)
      const result = await authClient.updateUser(values)

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Notification preferences updated successfully.")
        await refetch()
        router.refresh()
        form.reset({ ...values })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="overflow-hidden pb-0">
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
        <CardDescription>
          Choose which account-related emails you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-notifications" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldLabel htmlFor="form-notification-new-login-email">
              <Controller
                name="notificationNewLoginEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                    className="w-full"
                  >
                    <FieldContent>
                      <FieldTitle>New login detected</FieldTitle>
                      <FieldDescription>
                        Receive an email when a new sign-in is detected on your account.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                    <Switch
                      id="form-notification-new-login-email"
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                      aria-label="Toggle new login detected emails"
                    />
                  </Field>
                )}
              />
            </FieldLabel>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4">
        <Button
          type="submit"
          form="form-notifications"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
