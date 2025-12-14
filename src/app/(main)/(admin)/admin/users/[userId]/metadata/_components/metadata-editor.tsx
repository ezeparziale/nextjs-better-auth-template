"use client"

import { useCallback, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CodeIcon, CopyIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface MetadataEditorProps {
  userId: string
  userMetadata?: string | null
}

const formSchema = z.object({
  metadataJson: z.string().superRefine((val, ctx) => {
    try {
      JSON.parse(val)
    } catch (error) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        message: error instanceof Error ? error.message : "Invalid JSON format",
      })
    }
  }),
})

type FormData = z.infer<typeof formSchema>

export function MetadataEditor({ userId, userMetadata }: MetadataEditorProps) {
  const [isFormatting, setIsFormatting] = useState(false)

  const defaultJson = userMetadata
    ? typeof userMetadata === "string"
      ? JSON.stringify(JSON.parse(userMetadata), null, 2)
      : JSON.stringify(userMetadata, null, 2)
    : "{}"

  const form = useForm<FormData>({
    defaultValues: {
      metadataJson: defaultJson,
    },
    resolver: zodResolver(formSchema),
    mode: "onChange",
  })

  const { control } = form
  const { isSubmitting, isDirty } = form.formState

  const handleFormatWithError = useCallback(
    (json: string) => {
      try {
        return JSON.stringify(JSON.parse(json), null, 2)
      } catch (error) {
        form.setError("metadataJson", {
          type: "manual",
          message: error instanceof Error ? error.message : "Invalid JSON format",
        })
        return json
      }
    },
    [form],
  )

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    form.setValue("metadataJson", handleFormatWithError(pastedText), {
      shouldValidate: true,
    })
  }

  const handleFormat = async () => {
    setIsFormatting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const formatted = handleFormatWithError(form.getValues("metadataJson"))
      form.setValue("metadataJson", formatted, { shouldValidate: true })
    } finally {
      setIsFormatting(false)
    }
  }

  const handleCopy = useCallback(() => {
    const text = form.getValues("metadataJson")
    navigator.clipboard.writeText(text).then(() => {
      toast.info("Metadata copied to clipboard")
    })
  }, [form])

  const onSubmit = async (data: FormData) => {
    try {
      const metadataToSave = JSON.parse(data.metadataJson)

      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          metadata: metadataToSave,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      toast.success("Metadata saved successfully")
      form.reset({
        metadataJson: data.metadataJson,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save metadata")
    }
  }

  return (
    <form
      id="form-metadata"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full flex-col space-y-4"
    >
      <FieldGroup>
        <Controller
          name="metadataJson"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="relative">
                <FieldLabel htmlFor={field.name}>Metadata</FieldLabel>
                <div className="absolute -top-1.5 right-1 flex items-center space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="size-7"
                        disabled={isFormatting}
                      >
                        <CopyIcon className="size-4" />
                        <span className="sr-only">Copy</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFormat}
                        className="size-7"
                        disabled={isFormatting}
                      >
                        {isFormatting ? <Spinner /> : <CodeIcon className="size-4" />}
                        <span className="sr-only">Format JSON</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Format JSON</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="bg-background relative flex w-full rounded-lg border">
                <div
                  className="text-muted-foreground bg-muted/40 flex min-w-10 flex-col items-end border-r px-3 py-2 text-xs select-none"
                  aria-hidden="true"
                >
                  {Array.from(
                    { length: field.value.split("\n").length },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <div key={n} className="leading-5">
                      {n}
                    </div>
                  ))}
                </div>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter JSON metadata here"
                  autoFocus
                  disabled={isSubmitting}
                  rows={20}
                  className="flex-1 resize-none rounded-l-none border-0 bg-transparent p-3 font-mono leading-5"
                  onPaste={handlePaste}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <Button
            type="submit"
            form="form-metadata"
            disabled={isSubmitting || !isDirty}
            size="sm"
          >
            {isSubmitting && <Spinner />} Save
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !isDirty}
            className="w-full md:w-32"
            onClick={() => form.reset()}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
