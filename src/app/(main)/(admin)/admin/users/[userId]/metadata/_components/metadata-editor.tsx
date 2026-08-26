"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CheckIcon,
  Copy,
  EraserIcon,
  Maximize2Icon,
  Minimize2Icon,
  SparklesIcon,
} from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/components/ui/copy-button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

interface MetadataEditorProps {
  userId: string
  userMetadata?: string | null
}

const COLLAPSED_ROWS = 15
const EXPANDED_ROWS = 40

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

function getDefaultJson(metadata?: string | null) {
  if (!metadata) return "{}"
  try {
    return JSON.stringify(
      typeof metadata === "string" ? JSON.parse(metadata) : metadata,
      null,
      2,
    )
  } catch {
    return "{}"
  }
}

export function MetadataEditor({ userId, userMetadata }: MetadataEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLPreElement>(null)

  const form = useForm<FormData>({
    defaultValues: {
      metadataJson: getDefaultJson(userMetadata),
    },
    resolver: zodResolver(formSchema),
    mode: "onChange",
  })

  useEffect(() => {
    form.reset({ metadataJson: getDefaultJson(userMetadata) })
  }, [userMetadata, form])

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
      shouldDirty: true,
    })
  }

  const handleFormat = () => {
    const formatted = handleFormatWithError(form.getValues("metadataJson"))
    form.setValue("metadataJson", formatted, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const { copied, copy } = useCopyToClipboard({
    toastMessage: "Metadata copied to clipboard",
  })

  const handleCopy = useCallback(() => {
    copy(form.getValues("metadataJson"))
  }, [copy, form])

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.rows = isExpanded ? EXPANDED_ROWS : COLLAPSED_ROWS
    }
  }, [isExpanded])

  const handleTextareaScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

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
      className="flex w-full flex-col gap-4"
    >
      <FieldGroup>
        <Controller
          name="metadataJson"
          control={form.control}
          render={({ field, fieldState }) => {
            const lineCount = field.value.split("\n").length
            return (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <FieldLabel htmlFor={field.name}>Metadata</FieldLabel>
                  <div className="text-foreground flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">
                      {lineCount} {lineCount === 1 ? "line" : "lines"} ·{" "}
                      {field.value.length}{" "}
                      {field.value.length === 1 ? "character" : "characters"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFormat}
                    >
                      <SparklesIcon data-icon="inline-start" />
                      Format
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                    >
                      {copied === field.value ? (
                        <CheckIcon data-icon="inline-start" />
                      ) : (
                        <Copy data-icon="inline-start" />
                      )}
                      {copied === field.value ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.setValue("metadataJson", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <EraserIcon data-icon="inline-start" />
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleExpand}
                    >
                      {isExpanded ? (
                        <Minimize2Icon data-icon="inline-start" />
                      ) : (
                        <Maximize2Icon data-icon="inline-start" />
                      )}
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
                <div
                  className={cn(
                    "bg-background flex min-h-0 w-full overflow-hidden rounded-lg border",
                    fieldState.invalid && "border-destructive",
                  )}
                  style={{ height: isExpanded ? 560 : 360, maxHeight: "70vh" }}
                >
                  <pre
                    ref={lineNumbersRef}
                    className="text-muted-foreground bg-muted/40 h-full min-w-10 shrink-0 overflow-hidden border-r px-3 py-2 text-right font-mono text-xs leading-5 select-none"
                    aria-hidden="true"
                  >
                    {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
                  </pre>
                  <Textarea
                    {...field}
                    ref={(node) => {
                      textareaRef.current = node
                      field.ref(node)
                    }}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter JSON metadata here"
                    autoFocus
                    disabled={isSubmitting}
                    rows={COLLAPSED_ROWS}
                    className="h-full min-h-0 flex-1 resize-none overflow-auto rounded-l-none border-0 bg-transparent px-3 py-2 font-mono text-xs leading-5"
                    onPaste={handlePaste}
                    onScroll={handleTextareaScroll}
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )
          }}
        />
        <div className="flex flex-col gap-4 md:flex-row">
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
