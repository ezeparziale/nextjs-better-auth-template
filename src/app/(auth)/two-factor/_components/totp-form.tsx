"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeftIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"

const totpSchema = z.object({
  code: z.string().min(6, {
    message: "Your verification code must be 6 digits.",
  }),
})

type FormData = z.infer<typeof totpSchema>

export default function TotpForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const hasAutoSubmitted = useRef(false)

  const form = useForm<FormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      code: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormData) {
    const result = await authClient.twoFactor.verifyTotp(values)

    if (result.error) {
      toast.error(
        result.error.message || "Invalid verification code. Please try again.",
      )
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
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <InputOTP
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  autoFocus
                  aria-label="Six-digit verification code"
                  {...field}
                  onChange={(value) => {
                    const numericValue = value.replace(/\D/g, "")
                    field.onChange(numericValue)

                    if (value.length === 6 && !hasAutoSubmitted.current) {
                      hasAutoSubmitted.current = true
                      form.handleSubmit(onSubmit)()
                    }

                    if (value.length < 6) {
                      hasAutoSubmitted.current = false
                    }
                  }}
                >
                  <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Enter the 6-digit code from your authenticator app.
              </FormDescription>
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
