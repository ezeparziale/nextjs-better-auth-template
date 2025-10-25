/**
 * Utility functions for avatar image processing
 */

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Creates a cropped image from canvas
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5,
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y),
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"))
          return
        }
        resolve(blob)
      },
      "image/webp",
      0.9,
    )
  })
}

/**
 * Creates an image element from source
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

/**
 * Resizes and optimizes image to target size
 */
export async function resizeImage(blob: Blob, targetSize = 256): Promise<Blob> {
  const image = await createImage(URL.createObjectURL(blob))
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  canvas.width = targetSize
  canvas.height = targetSize

  ctx.drawImage(image, 0, 0, targetSize, targetSize)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (resizedBlob) => {
        if (!resizedBlob) {
          reject(new Error("Canvas is empty"))
          return
        }
        resolve(resizedBlob)
      },
      "image/webp",
      0.85,
    )
  })
}

/**
 * Validates file type and size
 */
export function validateImageFile(file: File): {
  valid: boolean
  error?: string
} {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPG, PNG, WebP, or GIF)",
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Image size must be less than 5MB",
    }
  }

  return { valid: true }
}

/**
 * Generates a secure filename for avatar
 */
export function generateAvatarFilename(): string {
  const uuid = crypto.randomUUID()
  return `${uuid}.webp`
}
