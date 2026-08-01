"use server"

import { UAParser } from "ua-parser-js"
import { getApproximateLocation } from "./geoip"

interface ParsedUserAgent {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: string
  deviceModel: string | undefined
  deviceDescription: string
  location: string
  ipAddress: string
}

export async function parseUserAgent(session: {
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<ParsedUserAgent> {
  const parser = new UAParser(session.userAgent || "")
  const result = parser.getResult()

  const browser = result.browser.name || "Unknown Browser"
  const browserVersion = result.browser.version
    ? ` ${result.browser.version.split(".")[0]}`
    : ""
  const os = result.os.name || "Unknown OS"
  const osVersion = result.os.version ? ` ${result.os.version}` : ""
  const deviceType = result.device.type || "desktop"
  const deviceModel = result.device.model
  const deviceDescription = `${browser}${browserVersion} on ${os}${osVersion}${
    deviceModel ? ` (${deviceModel})` : ""
  }`

  const location = await getApproximateLocation(session.ipAddress)

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceModel,
    deviceDescription,
    location,
    ipAddress: session.ipAddress || "Unknown",
  }
}
