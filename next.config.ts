import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "https://lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "https://avatars.githubusercontent.com",
      },
    ],
  },
  serverExternalPackages: ["pg"],
}

export default nextConfig
