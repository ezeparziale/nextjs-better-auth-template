import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const csvHeader = [
    "ID",
    "Name",
    "Email",
    "Role",
    "Email Verified",
    "Created At",
    "Last Login Method",
    "Banned",
  ].join(",")

  async function* getUsersInBatches(batchSize = 1000) {
    let cursor: string | undefined = undefined

    while (true) {
      const params: Prisma.UserFindManyArgs = {
        take: batchSize,
        orderBy: {
          createdAt: "desc",
        },
      }

      if (cursor) {
        params.cursor = { id: cursor }
        params.skip = 1
      }

      const users = await db.user.findMany(params)

      if (users.length === 0) {
        break
      }

      for (const user of users) {
        yield user
      }

      if (users.length < batchSize) {
        break
      }

      cursor = users[users.length - 1].id
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(csvHeader + "\n"))

      try {
        for await (const user of getUsersInBatches()) {
          const csvRow = [
            user.id,
            `"${user.name}"`,
            user.email,
            user.role,
            user.emailVerified,
            user.createdAt.toISOString(),
            user.lastLoginMethod || "",
            user.banned || false,
          ].join(",")

          controller.enqueue(encoder.encode(csvRow + "\n"))
        }
        controller.close()
      } catch (error) {
        console.error("Error exporting users:", error)
        controller.error(error)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="users.csv"',
    },
  })
}
