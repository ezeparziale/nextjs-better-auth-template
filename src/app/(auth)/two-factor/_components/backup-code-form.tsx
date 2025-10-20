"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeftIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const backupCodeSchema = z.object({
  code: z.string().min(10, { message: "Enter your backup code." }),
})

type FormData = z.infer<typeof backupCodeSchema>

export default function TotpForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: {
      code: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormData) {
    const result = await authClient.twoFactor.verifyBackupCode(values)

    if (result.error) {
      toast.error(result.error.message || "Invalid backup code. Please try again.")
    } else {
      router.push(callbackUrl || "/dashboard")
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col items-center space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Backup code</FormLabel>
              <FormControl>
                <Input {...field} autoFocus aria-label="Backup code" />
              </FormControl>
              <FormDescription>Each code can only be used once.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full flex-col items-center gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner />
                Verifying…
              </>
            ) : (
              "Verify"
            )}
          </Button>
          <Button type="button" onClick={() => router.push("/login")} variant="ghost">
            <ChevronLeftIcon />
            Back to login
          </Button>
        </div>
      </form>
    </Form>
  )
}
