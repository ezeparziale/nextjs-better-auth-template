"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  MultiSelectAsync,
  MultiSelectAsyncContent,
  MultiSelectAsyncTrigger,
  MultiSelectAsyncValue,
  type MultiSelectAsyncOption,
} from "@/components/ui/multi-select-async"
import { Spinner } from "@/components/ui/spinner"

const assignItemsSchema = z.object({
  itemIds: z.array(z.string()),
})

type FormData = z.infer<typeof assignItemsSchema>

interface AssignItemsDialogProps {
  /** ID del recurso (user, role, etc.) */
  resourceId: string
  /** Título del diálogo */
  title: string
  /** Descripción del diálogo */
  description: string
  /** Label del campo */
  fieldLabel: string
  /** Placeholder del select */
  placeholder: string
  /** Placeholder de búsqueda */
  searchPlaceholder: string
  /** Mensaje cuando no hay resultados */
  emptyMessage: string
  /** Texto del botón */
  buttonText: string
  /** Función para obtener items asignados actualmente */
  fetchAssignedItems: (
    resourceId: string,
  ) => Promise<Array<{ id: string; name: string }>>
  /** Función para buscar items disponibles */
  fetchAvailableItems: (search: string) => Promise<MultiSelectAsyncOption[]>
  /** Función para actualizar los items asignados */
  updateItems: (
    resourceId: string,
    itemIds: string[],
  ) => Promise<{ error?: { message?: string } }>
  /** Callback cuando se actualizan los items */
  onItemsUpdated: (options?: { resetPagination?: boolean }) => void
  /** Mensajes de éxito/error personalizados */
  messages?: {
    success?: string
    error?: string
    loadError?: string
  }
}

const LIMIT = 5

export default function AssignItemsDialog({
  resourceId,
  title,
  description,
  fieldLabel,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  buttonText,
  fetchAssignedItems,
  fetchAvailableItems,
  updateItems,
  onItemsUpdated,
  messages = {},
}: AssignItemsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false)
  const [selectedItemsCache, setSelectedItemsCache] = useState<
    Map<string, MultiSelectAsyncOption>
  >(new Map())

  const form = useForm<FormData>({
    resolver: zodResolver(assignItemsSchema),
    defaultValues: {
      itemIds: [],
    },
  })

  // Fetch function for async multi-select
  const fetchItems = async (search: string): Promise<MultiSelectAsyncOption[]> => {
    try {
      return await fetchAvailableItems(search)
    } catch (error) {
      console.error("Error fetching items:", error)
      toast.error(messages.loadError || "Failed to load items")
      return []
    }
  }

  // Load assigned items when dialog opens
  useEffect(() => {
    if (open) {
      const loadAssignedItems = async () => {
        setIsLoadingAssigned(true)
        try {
          const allItems: Array<{ id: string; name: string }> = []
          const items = await fetchAssignedItems(resourceId)

          if (items && items.length > 0) {
            allItems.push(...items)
          }

          if (allItems.length > 0) {
            const itemIds = allItems.map((item) => item.id)

            // Pre-load the selected items' labels into cache
            const selectedOptions = allItems.map((item) => ({
              value: item.id,
              label: item.name,
            }))

            const newCache = new Map<string, MultiSelectAsyncOption>()
            selectedOptions.forEach((option) => {
              newCache.set(option.value, option)
            })
            setSelectedItemsCache(newCache)

            form.reset({
              itemIds,
            })
          }
        } catch {
          toast.error(messages.loadError || "Failed to load assigned items")
        } finally {
          setIsLoadingAssigned(false)
        }
      }
      loadAssignedItems()
    } else {
      form.reset({ itemIds: [] })
      setSelectedItemsCache(new Map())
    }
  }, [open, resourceId, form, fetchAssignedItems, messages.loadError])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await updateItems(resourceId, values.itemIds)

      if (error) {
        toast.error(error.message || messages.error || "Failed to update items")
      } else {
        toast.success(messages.success || "Items updated successfully")
        handleOpenChange(false)
        onItemsUpdated({ resetPagination: true })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="py-4">
            <Controller
              name="itemIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel>{fieldLabel}</FieldLabel>
                  <MultiSelectAsync
                    values={field.value}
                    onValuesChange={field.onChange}
                    disabled={isLoadingAssigned}
                    fetchOptions={fetchItems}
                    initialLimit={LIMIT}
                    debounceMs={300}
                    preloadedOptions={Array.from(selectedItemsCache.values())}
                  >
                    <MultiSelectAsyncTrigger className="w-full">
                      <MultiSelectAsyncValue
                        placeholder={isLoadingAssigned ? "Loading..." : placeholder}
                        overflowBehavior="wrap"
                      />
                    </MultiSelectAsyncTrigger>
                    <MultiSelectAsyncContent
                      searchPlaceholder={searchPlaceholder}
                      emptyMessage={emptyMessage}
                    />
                  </MultiSelectAsync>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoadingAssigned || isSubmitting || !isDirty}
            >
              {isSubmitting && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
