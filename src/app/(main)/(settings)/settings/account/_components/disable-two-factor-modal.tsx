import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import {
  DisableTwoFactorAuthForm,
  disableTwoFactorAuthSchema,
} from "@/schemas/two-factor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export default function DisableTwoFactorModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  const form = useForm<DisableTwoFactorAuthForm>({
    resolver: zodResolver(disableTwoFactorAuthSchema),
    defaultValues: {
      password: "",
      confirmed: false,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  async function onSubmit(values: DisableTwoFactorAuthForm) {
    try {
      const result = await authClient.twoFactor.disable({
        password: values.password,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to disable 2FA")
      } else {
        toast.success("Two-factor authentication disabled successfully.")
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disable 2FA</DialogTitle>
          <DialogDescription>
            Please enter your password to disable 2FA in your account
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Disabling 2FA will make your account less secure. You&apos;ll only need your
            password to sign in.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmed"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    I understand that disabling 2FA will reduce my account security
                  </FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} variant="destructive">
                {isSubmitting ? (
                  <>
                    <Spinner /> Disabling…
                  </>
                ) : (
                  "Disable"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
