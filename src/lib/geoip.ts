const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fe80:/i,
]

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/

const locationCache = new Map<string, { value: string; expires: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60

function isPrivateOrLocal(ip: string): boolean {
  if (ip === "localhost") return true
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip))
}

export async function getApproximateLocation(
  ip: string | null | undefined,
): Promise<string> {
  if (!ip) return "Unknown"

  if (isPrivateOrLocal(ip)) return "Localhost"

  if (!IP_REGEX.test(ip)) return "Unknown"

  const cached = locationCache.get(ip)
  if (cached && cached.expires > Date.now()) {
    return cached.value
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    if (!res.ok) return "Unknown"

    const data = await res.json()

    if (data.status === "success") {
      const location = [data.city, data.regionName, data.country]
        .filter(Boolean)
        .join(", ")
      locationCache.set(ip, { value: location, expires: Date.now() + CACHE_TTL_MS })
      return location
    }
  } catch (error) {
    console.error("GeoIP lookup failed:", error)
  }

  return "Unknown"
}
