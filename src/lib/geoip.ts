const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
]

const IP_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$|^[0-9a-fA-F:]+$/

const locationCache = new Map<string, { value: string; expires: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60
const LOOKUP_TIMEOUT_MS = 3000

function isPrivateOrLocal(ip: string): boolean {
  const normalizedIp = ip.trim().toLowerCase()

  if (normalizedIp === "localhost") return true

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalizedIp))
}

export async function getApproximateLocation(
  ip: string | null | undefined,
): Promise<string> {
  const normalizedIp = ip?.trim()

  if (!normalizedIp) return "Unknown"
  if (isPrivateOrLocal(normalizedIp)) return "Localhost"
  if (!IP_REGEX.test(normalizedIp)) return "Unknown"

  const cached = locationCache.get(normalizedIp)
  if (cached) {
    if (cached.expires > Date.now()) return cached.value
    locationCache.delete(normalizedIp)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(
        normalizedIp,
      )}?fields=status,city,regionName,country`,
      { signal: controller.signal },
    )

    if (!res.ok) return "Unknown"

    const data: {
      status?: string
      city?: string
      regionName?: string
      country?: string
    } = await res.json()

    if (data.status !== "success") return "Unknown"

    const location = [data.city, data.regionName, data.country]
      .filter(Boolean)
      .join(", ")

    const value = location || "Unknown"

    locationCache.set(normalizedIp, {
      value,
      expires: Date.now() + CACHE_TTL_MS,
    })

    return value
  } catch (error) {
    console.error("GeoIP lookup failed:", error)
    return "Unknown"
  } finally {
    clearTimeout(timeout)
  }
}
