import { NextResponse, type NextRequest } from "next/server"
import { del, put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { generateAvatarFilename } from "@/lib/avatar-utils"
import prismadb from "@/lib/prismadb"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove old avatar
    if (session.user.image) {
      await del(session.user.image)
    }

    // Upload new avatar
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = session.user.id

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
    await prismadb.user.update({
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
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete from Vercel Blob
    if (session.user.image) {
      await del(session.user.image)
    }

    await prismadb.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Avatar delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
