"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type MultiSelectAsyncOption = {
  value: string
  label: ReactNode
}

type FetchFunction = (search: string) => Promise<MultiSelectAsyncOption[]>

type MultiSelectAsyncContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  selectedValues: Set<string>
  toggleValue: (value: string) => void
  items: Map<string, ReactNode>
  onItemAdded: (value: string, label: ReactNode) => void
  disabled?: boolean
  options: MultiSelectAsyncOption[]
  isLoading: boolean
  searchValue: string
  setSearchValue: (value: string) => void
}

const MultiSelectAsyncContext = createContext<MultiSelectAsyncContextType | null>(null)

export function MultiSelectAsync({
  children,
  values,
  defaultValues,
  onValuesChange,
  disabled,
  fetchOptions,
  initialLimit = 10,
  debounceMs = 300,
  preloadedOptions = [],
}: {
  children: ReactNode
  values?: string[]
  defaultValues?: string[]
  onValuesChange?: (values: string[]) => void
  disabled?: boolean
  fetchOptions: FetchFunction
  initialLimit?: number
  debounceMs?: number
  preloadedOptions?: MultiSelectAsyncOption[]
}) {
  const [open, setOpen] = useState(false)
  const [internalValues, setInternalValues] = useState(
    new Set<string>(values ?? defaultValues),
  )
  const selectedValues = values ? new Set(values) : internalValues

  // Initialize items map with preloaded options
  const [items, setItems] = useState<Map<string, ReactNode>>(() => {
    const initialMap = new Map<string, ReactNode>()
    preloadedOptions.forEach((option) => {
      initialMap.set(option.value, option.label)
    })
    return initialMap
  })

  const [options, setOptions] = useState<MultiSelectAsyncOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(false)

  function toggleValue(value: string) {
    if (disabled) return
    const getNewSet = (prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(value)) {
        newSet.delete(value)
      } else {
        newSet.add(value)
      }
      return newSet
    }
    setInternalValues(getNewSet)
    onValuesChange?.([...getNewSet(selectedValues)])
  }

  const onItemAdded = useCallback((value: string, label: ReactNode) => {
    setItems((prev) => {
      if (prev.get(value) === label) return prev
      return new Map(prev).set(value, label)
    })
  }, [])

  // Update items when preloadedOptions change
  useEffect(() => {
    if (preloadedOptions.length > 0) {
      setItems((prev) => {
        const newMap = new Map(prev)
        preloadedOptions.forEach((option) => {
          newMap.set(option.value, option.label)
        })
        return newMap
      })
    }
  }, [preloadedOptions])

  // Fetch options function
  const fetchData = useCallback(
    async (search: string) => {
      setIsLoading(true)
      try {
        const results = await fetchOptions(search)
        // If it's the initial load, limit the results
        if (!search && !initialLoadRef.current) {
          setOptions(results.slice(0, initialLimit))
          initialLoadRef.current = true
        } else {
          setOptions(results)
        }
      } catch (error) {
        console.error("Error fetching options:", error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOptions, initialLimit],
  )

  // Initial load when popover opens
  useEffect(() => {
    if (open && !initialLoadRef.current) {
      fetchData("")
    }
  }, [open, fetchData])

  // Debounced search
  useEffect(() => {
    if (!open) return

    // Skip if it's the initial load (no search value and initial load hasn't happened yet)
    // The initial load is handled by the previous useEffect
    if (!searchValue && !initialLoadRef.current) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchData(searchValue)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue, open, fetchData, debounceMs])

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchValue("")
    }
  }, [open])

  return (
    <MultiSelectAsyncContext.Provider
      value={{
        open,
        setOpen,
        selectedValues,
        toggleValue,
        items,
        onItemAdded,
        disabled,
        options,
        isLoading,
        searchValue,
        setSearchValue,
      }}
    >
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen} modal={true}>
        {children}
      </Popover>
    </MultiSelectAsyncContext.Provider>
  )
}

export function MultiSelectAsyncTrigger({
  className,
  children,
  ...props
}: {
  className?: string
  children?: ReactNode
} & ComponentPropsWithoutRef<typeof Button>) {
  const { open, disabled } = useMultiSelectAsyncContext()

  return (
    <PopoverTrigger asChild>
      <Button
        {...props}
        disabled={disabled}
        variant={props.variant ?? "outline"}
        role={props.role ?? "combobox"}
        aria-expanded={props["aria-expanded"] ?? open}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='text-'])]:text-muted-foreground flex h-auto min-h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
      >
        {children}
        <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
  )
}

export function MultiSelectAsyncValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = "wrap-when-open",
  ...props
}: {
  placeholder?: string
  clickToRemove?: boolean
  overflowBehavior?: "wrap" | "wrap-when-open" | "cutoff"
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const { selectedValues, toggleValue, items, open, disabled } =
    useMultiSelectAsyncContext()
  const [overflowAmount, setOverflowAmount] = useState(0)
  const valueRef = useRef<HTMLDivElement>(null)
  const overflowRef = useRef<HTMLDivElement>(null)

  const shouldWrap =
    overflowBehavior === "wrap" || (overflowBehavior === "wrap-when-open" && open)

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return

    const containerElement = valueRef.current
    const overflowElement = overflowRef.current
    const items = containerElement.querySelectorAll<HTMLElement>("[data-selected-item]")

    if (overflowElement != null) overflowElement.style.display = "none"
    items.forEach((child) => child.style.removeProperty("display"))
    let amount = 0
    for (let i = items.length - 1; i >= 0; i--) {
      const child = items[i]!
      if (containerElement.scrollWidth <= containerElement.clientWidth) {
        break
      }
      amount = items.length - i
      child.style.display = "none"
      overflowElement?.style.removeProperty("display")
    }
    setOverflowAmount(amount)
  }, [])

  const handleResize = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node

      const mutationObserver = new MutationObserver(checkOverflow)
      const observer = new ResizeObserver(debounce(checkOverflow, 100))

      mutationObserver.observe(node, {
        childList: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      })
      observer.observe(node)

      return () => {
        observer.disconnect()
        mutationObserver.disconnect()
        valueRef.current = null
      }
    },
    [checkOverflow],
  )

  if (selectedValues.size === 0 && placeholder) {
    return (
      <span className="text-muted-foreground min-w-0 overflow-hidden font-normal">
        {placeholder}
      </span>
    )
  }

  return (
    <div
      {...props}
      ref={handleResize}
      className={cn(
        "flex w-full gap-1.5 overflow-hidden",
        shouldWrap && "h-full flex-wrap",
        className,
      )}
    >
      {[...selectedValues]
        .filter((value) => items.has(value))
        .map((value) => (
          <Badge
            variant="outline"
            data-selected-item
            className="group flex items-center gap-1"
            key={value}
            onClick={
              clickToRemove && !disabled
                ? (e) => {
                    e.stopPropagation()
                    toggleValue(value)
                  }
                : undefined
            }
          >
            {items.get(value)}
            {clickToRemove && (
              <XIcon className="text-muted-foreground group-hover:text-destructive size-2" />
            )}
          </Badge>
        ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? "block" : "none",
        }}
        variant="outline"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  )
}

export function MultiSelectAsyncContent({
  searchPlaceholder = "Search...",
  emptyMessage = "No found results  .",
  contentPlaceholder,
  showContentPlaceholder = true,
  children,
  ...props
}: {
  searchPlaceholder?: string
  emptyMessage?: string
  contentPlaceholder?: string
  showContentPlaceholder?: boolean
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<typeof Command>, "children">) {
  const { options, isLoading, setSearchValue } = useMultiSelectAsyncContext()

  return (
    <>
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>
      <PopoverContent
        align="start"
        className="min-w-(--radix-popover-trigger-width) p-0"
      >
        <Command {...props} shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <>
                <CommandGroup>
                  {options.map((option) => (
                    <MultiSelectAsyncItem
                      key={option.value}
                      value={option.value}
                      badgeLabel={option.label}
                    >
                      {option.label}
                    </MultiSelectAsyncItem>
                  ))}
                </CommandGroup>
                {showContentPlaceholder && options.length > 0 && (
                  <div className="text-muted-foreground border-t px-3 py-2 text-center text-xs">
                    {contentPlaceholder ||
                      `Showing up to ${options.length} results. Keep typing to refine...`}
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </>
  )
}

export function MultiSelectAsyncItem({
  value,
  children,
  badgeLabel,
  onSelect,
  ...props
}: {
  badgeLabel?: ReactNode
  value: string
} & Omit<ComponentPropsWithoutRef<typeof CommandItem>, "value">) {
  const { toggleValue, selectedValues, onItemAdded, disabled } =
    useMultiSelectAsyncContext()
  const isSelected = selectedValues.has(value)

  useEffect(() => {
    onItemAdded(value, badgeLabel ?? children)
  }, [value, children, onItemAdded, badgeLabel])

  return (
    <CommandItem
      {...props}
      disabled={disabled}
      onSelect={() => {
        toggleValue(value)
        onSelect?.(value)
      }}
    >
      <CheckIcon
        className={cn("mr-2 size-4", isSelected ? "opacity-100" : "opacity-0")}
      />
      {children}
    </CommandItem>
  )
}

export function MultiSelectAsyncGroup(
  props: ComponentPropsWithoutRef<typeof CommandGroup>,
) {
  return <CommandGroup {...props} />
}

export function MultiSelectAsyncSeparator(
  props: ComponentPropsWithoutRef<typeof CommandSeparator>,
) {
  return <CommandSeparator {...props} />
}

function useMultiSelectAsyncContext() {
  const context = useContext(MultiSelectAsyncContext)
  if (context == null) {
    throw new Error(
      "useMultiSelectAsyncContext must be used within a MultiSelectAsyncContext",
    )
  }
  return context
}

function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}
