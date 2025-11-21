import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DateDescription } from "@/components/date-description"

interface AuditInfoProps {
  createdBy?: string | null
  createdAt?: Date | null
  updatedBy?: string | null
  updatedAt?: Date | null
}

export function AuditInfo({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: AuditInfoProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(createdBy || createdAt) && (
          <TableRow>
            <TableCell>Created</TableCell>
            <TableCell>
              {createdAt ? <DateDescription date={createdAt} /> : "-"}
            </TableCell>
            <TableCell>
              {createdBy ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {createdBy.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{createdBy}</span>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        )}
        {(updatedBy || updatedAt) && (
          <TableRow>
            <TableCell>Updated</TableCell>
            <TableCell>
              {updatedAt ? <DateDescription date={updatedAt} /> : "-"}
            </TableCell>
            <TableCell>
              {updatedBy ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {updatedBy.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{updatedBy}</span>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
