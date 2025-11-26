import { Passkey } from "@better-auth/passkey"
import { KeyRoundIcon, MoreVerticalIcon, PencilIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PasskeyCardProps {
  passkey: Passkey
  onEdit: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
}

export function PasskeyCard({ passkey, onEdit, onDelete }: PasskeyCardProps) {
  return (
    <Card className="border-muted">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="bg-primary/10 shrink-0 rounded-lg p-2">
              <KeyRoundIcon className="text-primary size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <CardTitle className="truncate text-base">{passkey.name}</CardTitle>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            >
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(passkey)}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(passkey)} variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  )
}
