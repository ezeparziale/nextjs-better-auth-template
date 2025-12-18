import { NextResponse, type NextRequest } from "next/server"
import { del, put } from "@vercel/blob"
import { auth } from "@/lib/auth/auth"
import { generateAvatarFilename } from "@/lib/avatar-utils"
import { db } from "@/lib/db"

const imageProviders = [
  "https://lh3.googleusercontent.com",
  "https://avatars.githubusercontent.com",
]

type Params = Promise<{ userId: string }>

export async function POST(request: NextRequest, props: { params: Params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const { userId } = params

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove old avatar if it exists and is hosted by us
    if (
      targetUser.image &&
      !imageProviders.some((provider) => targetUser.image?.startsWith(provider))
    ) {
      await del(targetUser.image)
    }

    // Upload new avatar
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate secure filename
    const filename = generateAvatarFilename()

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    })

    // Update user in database
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        image: blob.url,
      },
    })

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      size: file.size,
    })
  } catch (error) {
    console.error("Admin avatar upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const { userId } = params

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    if (
      targetUser.image &&
      !imageProviders.some((provider) => targetUser.image?.startsWith(provider))
    ) {
      await del(targetUser.image)
    }

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        image: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin avatar delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
