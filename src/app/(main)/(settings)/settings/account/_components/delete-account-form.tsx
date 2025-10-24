"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlertIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const CONFIRMATION_TEXT = "delete my personal account"

export function DeleteAccountForm({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const formSchema = z.object({
    email: z.email(),
    confirmation: z.string(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      confirmation: "",
    },
  })

  const isConfirmationTextMatching =
    form.watch("email") === userEmail &&
    form.watch("confirmation") === CONFIRMATION_TEXT

  async function handleDeleteAccount() {
    setIsLoading(true)
    try {
      const res = await authClient.deleteUser()

      if (res.error) {
        toast.error("Failed to delete account")
        return
      }
      toast.success("Account deleted successfully")
      setIsDialogOpen(false)

      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/40 pb-0">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all of your content.
          </CardDescription>
        </CardHeader>
        <CardFooter className="bg-destructive/15 border-t-destructive/40 justify-end rounded-b-xl border-t py-4!">
          <Button variant="destructive" onClick={() => setIsDialogOpen(true)} size="sm">
            Delete account
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <Form {...form}>
            <form>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This will permanently delete your account and remove your data from
                  our servers.
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive" className="bg-destructive/5 my-4">
                <CircleAlertIcon aria-hidden="true" />
                <AlertTitle>This action cannot be undone.</AlertTitle>
              </Alert>
              <div className="my-4 space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex-wrap">
                        Enter your email{" "}
                        <span className="text-muted-foreground">{userEmail}</span> to
                        continue:
                      </FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex-wrap">
                        Type{" "}
                        <span className="text-muted-foreground">
                          {CONFIRMATION_TEXT}
                        </span>{" "}
                        to confirm
                      </FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  className={buttonVariants({ variant: "destructive" })}
                  disabled={!isConfirmationTextMatching || isLoading}
                  onClick={form.handleSubmit(handleDeleteAccount)}
                  aria-label="Delete Account"
                >
                  {isLoading ? (
                    <>
                      <Spinner /> Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
