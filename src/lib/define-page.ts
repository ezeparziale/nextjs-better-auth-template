import type { Metadata } from "next"

export function definePage<T extends { title: string; description: string }>(
  config: T,
) {
  const metadata: Metadata = {
    title: config.title,
    description: config.description,
  }

  return {
    ...config,
    metadata,
  }
}
