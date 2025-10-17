import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Check, Copy, Download } from "lucide-react"
import { useForm } from "react-hook-form"
import QRCode from "react-qr-code"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth-client"
import {
  EnableTwoFactorAuthForm,
  enableTwoFactorAuthSchema,
} from "@/schemas/two-factor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Step = "password" | "setup" | "verify" | "backup"

type TwoFactorData = {
  totpURI: string
  backupCodes: string[]
}

export default function EnableTwoFactorModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<Step>("password")
  const [isVerifying, setIsVerifying] = useState(false)

  const router = useRouter()
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)

  const form = useForm<EnableTwoFactorAuthForm>({
    resolver: zodResolver(enableTwoFactorAuthSchema),
    defaultValues: {
      password: "",
    },
  })

  async function handlePasswordVerify(values: EnableTwoFactorAuthForm) {
    setIsVerifying(true)

    try {
      const result = await authClient.twoFactor.enable({
        password: values.password,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to enable 2FA")
        return
      }
      setTwoFactorData(result.data)
      form.reset()
      setStep("setup")
    } catch {
      toast.error("Failed to enable 2FA")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setStep("password")

    if (step === "backup") {
      setTwoFactorData(null)
      router.refresh()
    }
  }

  const stepNumber = {
    password: 1,
    setup: 2,
    verify: 3,
    backup: 4,
  }[step]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <div className="mt-2 flex items-center gap-2">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  num <= stepNumber ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <DialogDescription className="mt-2">
            {step === "password" &&
              "Please enter your password to continue with 2FA setup"}
            {step === "setup" && "Scan the QR code with your authenticator app"}
            {step === "verify" && "Enter the 6-digit code from your authenticator app"}
            {step === "backup" && "Store these codes in a safe place"}
          </DialogDescription>
        </DialogHeader>
        {step === "password" && (
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handlePasswordVerify)}
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isVerifying}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Spinner /> Verifying…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        {step === "setup" && (
          <QRCodeSetup
            totpURI={twoFactorData?.totpURI ?? ""}
            onContinue={() => {
              setStep("verify")
            }}
          />
        )}
        {step === "verify" && (
          <VerificationInput
            onSuccess={() => {
              setStep("backup")
            }}
            setStep={setStep}
          />
        )}
        {step === "backup" && (
          <BackupCodes
            backupCodes={twoFactorData?.backupCodes ?? []}
            onComplete={() => handleClose()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function QRCodeSetup({
  totpURI,
  onContinue,
}: {
  totpURI: string
  onContinue: () => void
}) {
  const [copied, setCopied] = useState(false)

  const secret = totpURI ? totpURI.split("secret=")[1]?.split("&")[0] || "" : ""
  let accountName = ""

  if (totpURI) {
    const match = totpURI.match(/^otpauth:\/\/totp\/([^:]+):([^?]+)\?/)
    if (match) {
      accountName = decodeURIComponent(match[2])
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(secret)
    toast.info("Secret key copied to clipboard")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="mb-2 grid w-full grid-cols-2">
          <TabsTrigger value="qr">Scan QR Code</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="qr" className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="border-border rounded-lg border-2 bg-white p-4">
              <QRCode size={256} value={totpURI} />
            </div>
            <div className="text-center">
              <p className="text-foreground text-sm font-medium">
                Scan with your authenticator app
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Use Google Authenticator, Authy, or any TOTP app
              </p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <Label>Enter this key manually in your authenticator app</Label>
            <div className="flex items-center gap-2">
              <Input
                value={secret}
                readOnly
                className="font-mono text-sm"
                aria-label="Secret key for manual entry"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy()}
                aria-label="Copy secret key"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">Account: {accountName}</p>
            <p className="text-muted-foreground text-sm">Type: Time-based (TOTP)</p>
          </div>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <Button onClick={onContinue}>Continue to verification</Button>
      </DialogFooter>
    </div>
  )
}

const FormSchema = z.object({
  code: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
})

function VerificationInput({
  onSuccess,
  setStep,
}: {
  onSuccess: () => void
  setStep: (step: Step) => void
}) {
  const hasAutoSubmitted = useRef(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      const res = await authClient.twoFactor.verifyTotp(values)
      if (res.error) {
        toast.error(res.error.message || "Failed to verify code")
        return
      }
      onSuccess()
    } catch {
      toast.error("Failed to verify code")
    }
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col items-center space-y-6"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputOTP
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]*"
                    autoFocus
                    aria-label="Six digit verification code"
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
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("setup")}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner /> Verifying...
                </>
              ) : (
                "Verify code"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  )
}

function BackupCodes({
  backupCodes,
  onComplete,
}: {
  backupCodes: string[]
  onComplete: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const handleCopy = () => {
    const codesText = backupCodes.join("\n")
    navigator.clipboard.writeText(codesText)
    toast.info("Codes copied to clipboard")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const codesText = backupCodes.join("\n")
    const blob = new Blob([codesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "2fa-backup-codes.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    toast.info("Codes downloaded")
    setTimeout(() => setDownloaded(false), 2000)
  }
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle> Important: Save these codes now</AlertTitle>
        <AlertDescription>
          Each code can only be used once. You won&apos;t be able to see them again
          after leaving this page.{" "}
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div className="border-border bg-muted/30 grid grid-cols-1 gap-2 rounded-lg border p-4 md:grid-cols-2">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="bg-background flex items-center gap-2 rounded-md px-3 py-2 text-center"
            >
              <code className="text-foreground flex-1 font-mono text-sm font-medium">
                {code}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex-1 bg-transparent"
        >
          {copied ? (
            <>
              <Check className="text-success size-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy codes
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex-1 bg-transparent"
        >
          <Download className="size-4" />
          {downloaded ? "Downloaded!" : "Download Codes"}
        </Button>
      </div>

      <Button onClick={onComplete} className="w-full">
        Complete setup
      </Button>
    </div>
  )
}
