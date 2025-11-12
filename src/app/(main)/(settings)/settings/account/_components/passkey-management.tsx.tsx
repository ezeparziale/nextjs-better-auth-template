"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Passkey } from "better-auth/plugins/passkey"
import {
  InfoIcon,
  KeyRoundIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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

const passkeySchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
})

type FormData = z.infer<typeof passkeySchema>

export default function PasskeyManagement({
  passKeys,
  hasPasswordAccount,
}: {
  passKeys: Passkey[]
  hasPasswordAccount: boolean
}) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(passkeySchema),
    defaultValues: {
      name: "",
    },
  })

  const { isSubmitting } = form.formState

  const passkeyToDelete = passKeys.find((pk) => pk.id === deletePasskeyId)

  async function onSubmit(values: FormData) {
    try {
      const result = await authClient.passkey.addPasskey({
        name: values.name,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to add passkey")
        return
      }

      toast.success("Passkey added successfully")
      form.reset()
      setIsDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to add passkey")
    }
  }

  async function handleDeletePasskey(passkeyId: string) {
    setIsDeleting(true)
    try {
      const result = await authClient.passkey.deletePasskey({ id: passkeyId })
      if (result.error) {
        toast.error(result.error.message || "Failed to delete passkey")
        return
      }
      toast.success("Passkey deleted successfully")
      setDeletePasskeyId(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete passkey")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                Passkey management
              </CardTitle>
              <CardDescription>
                Manage your passkeys for secure, passwordless authentication across all
                your devices.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              aria-label="Add passkey"
              className="shrink-0"
              disabled={!hasPasswordAccount}
            >
              <PlusIcon />
              <span className="hidden sm:inline">Create new passkey</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasPasswordAccount ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InfoIcon />
                </EmptyMedia>
                <EmptyTitle>Password Required</EmptyTitle>
                <EmptyDescription>
                  Create a password first to enable passkey management.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : passKeys.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <KeyRoundIcon />
                </EmptyMedia>
                <EmptyTitle>No passkeys yet</EmptyTitle>
                <EmptyDescription>
                  Create your first passkey to enable fast, secure, passwordless sign-in
                  on this device.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  aria-label="Add passkey"
                >
                  <PlusIcon />
                  Create your first passkey
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {passKeys.length} {passKeys.length === 1 ? "passkey" : "passkeys"}{" "}
                  configured
                </p>
                <Badge variant="secondary" className="gap-1.5">
                  <ShieldCheckIcon className="size-3" />
                  Secure
                </Badge>
              </div>
              {passKeys.map((passkey) => (
                <Card key={passkey.id} className="border-muted">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="bg-primary/10 shrink-0 rounded-lg p-2">
                          <KeyRoundIcon className="text-primary size-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <CardTitle className="truncate text-base">
                            {passkey.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Created{" "}
                            {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        aria-label="Delete passkey"
                        disabled={isDeleting}
                        size="sm"
                        onClick={() => setDeletePasskeyId(passkey.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={isDialogOpen}
        onOpenChange={(o) => {
          if (!o) form.reset()
          setIsDialogOpen(o)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add passkey</DialogTitle>
            <DialogDescription>
              Give your passkey a memorable name to identify this device.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="off"
                          placeholder="e.g., My desktop"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} aria-label="Add passkey">
                  {isSubmitting ? (
                    <>
                      <Spinner /> Adding…
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deletePasskeyId !== null}
        onOpenChange={(open) => !open && setDeletePasskeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="text-foreground font-semibold">
                &quot;{passkeyToDelete?.name}&quot;
              </span>
              . You&apos;ll need to create a new passkey to use passwordless
              authentication on this device again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => deletePasskeyId && handleDeletePasskey(deletePasskeyId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
