"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useCallback, useState } from "react"
import { UploadIcon, XIcon, ZoomInIcon } from "lucide-react"
import Cropper from "react-easy-crop"
import { toast } from "sonner"
import { useSession } from "@/lib/auth/auth-client"
import {
  getCroppedImg,
  resizeImage,
  validateImageFile,
  type CropArea,
} from "@/lib/avatar-utils"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"

interface AdminAvatarFormProps {
  userId: string
  initialImage?: string | null
  userName?: string
}

export default function AdminAvatarForm({
  userId,
  initialImage,
  userName = "User",
}: AdminAvatarFormProps) {
  const router = useRouter()
  const { data: session, refetch } = useSession()

  // State for image upload and cropping
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Loading states
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentAvatar = initialImage

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateImageFile(file)

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setIsDialogOpen(true)
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }

    e.target.value = ""
  }

  // Handle crop complete
  const onCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    [],
  )

  // Upload avatar
  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return
    }

    setIsUploading(true)

    try {
      // Crop the image
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)

      // Resize and optimize
      const optimizedBlob = await resizeImage(croppedBlob, 256)

      // Create FormData
      const formData = new FormData()
      formData.append("file", optimizedBlob, "avatar.webp")

      // Upload to server using admin endpoint
      const response = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      toast.success("Avatar updated successfully")

      // Reset state
      setIsDialogOpen(false)
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)

      // Refresh to show new avatar
      router.refresh()

      // If updating own profile, refresh session
      if (session?.user.id === userId) {
        await refetch()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
    }
  }

  // Delete avatar
  const handleDelete = async () => {
    if (!currentAvatar) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Delete failed")
      }

      toast.success("Avatar removed successfully")
      router.refresh()

      // If updating own profile, refresh session
      if (session?.user.id === userId) {
        await refetch()
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove avatar")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetState = () => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setIsDialogOpen(false)
  }

  // Get user initials for fallback
  const getUserInitials = () => {
    return userName.toUpperCase().slice(0, 1)
  }

  return (
    <>
      <Card className="mb-6 pb-0">
        <CardHeader className="grid auto-rows-min grid-cols-[1fr_auto] items-start gap-2 px-6">
          <CardHeader className="p-0 pr-2">
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Click on the avatar to upload a custom one from your files.
            </CardDescription>
          </CardHeader>
          <CardAction className="self-start justify-self-end">
            <div className="relative">
              <Avatar
                className="size-20 cursor-pointer border transition hover:opacity-80"
                key={currentAvatar ? "form-avatar" : "form-avatar-no-image"}
                onClick={() => document.getElementById("admin-avatar-upload")?.click()}
              >
                <AvatarImage src={currentAvatar || ""} alt={userName} />
                <AvatarFallback className="cursor-pointer text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {currentAvatar && (
                <Button
                  className="absolute end-0 top-0 size-5 cursor-pointer rounded-full border"
                  size="icon"
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={isDeleting || isUploading}
                  aria-label="Remove avatar"
                >
                  <XIcon />
                </Button>
              )}
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter
          className={cn(
            "bg-sidebar flex items-center justify-start rounded-b-xl border-t py-4!",
            currentAvatar && "justify-between gap-4",
          )}
        >
          <CardDescription>
            Upload a profile picture. Recommended size: 256x256px.
          </CardDescription>
        </CardFooter>
      </Card>

      <input
        type="file"
        id="admin-avatar-upload"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={isUploading || isDeleting}
      />

      {/* Crop Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(o) => {
          if (o) {
            handleResetState()
          }
          setIsDialogOpen(o)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop avatar</DialogTitle>
            <DialogDescription>
              Adjust the crop area and zoom to get the perfect avatar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cropper */}
            <div className="bg-muted relative h-[400px] w-full overflow-hidden rounded-lg">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-muted-foreground text-sm">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomInIcon className="text-muted-foreground size-4" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetState}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading && <Spinner />}
              <UploadIcon className="size-4" />
              Upload avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
