"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Passkey } from "better-auth/plugins/passkey"
import { PlusIcon, TrashIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"
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
  DialogTrigger,
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

const passkeySchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
})

type FormData = z.infer<typeof passkeySchema>

export default function PasskeyManagement({ passKeys }: { passKeys: Passkey[] }) {
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
              <CardTitle>Passkey Management</CardTitle>
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
            >
              <PlusIcon />
              Create new passkey
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {passKeys.length === 0 ? (
            <span>No passkeys found.</span>
          ) : (
            <div className="space-y-3">
              {passKeys.map((passkey) => (
                <Card key={passkey.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <CardTitle>{passkey.name}</CardTitle>
                        <CardDescription>
                          Created on {new Date(passkey.createdAt).toISOString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletePasskeyId(passkey.id)}
                        className="shrink-0"
                      >
                        <TrashIcon />
                        Delete
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
          if (o) form.reset()
          setIsDialogOpen(o)
        }}
      >
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Add passkey</DialogTitle>
                <DialogDescription>
                  Add a new passkey to your account.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex-wrap">Name</FormLabel>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the passkey{" "}
              <span className="text-foreground font-semibold">
                &quot;{passkeyToDelete?.name}&quot;
              </span>{" "}
              and you will need to create a new one to use passwordless authentication.
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
