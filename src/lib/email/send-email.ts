"use server"

import { render } from "@react-email/components"
import {
  APIError,
  AuthContext,
  BetterAuthOptions,
  MiddlewareContext,
  MiddlewareOptions,
  User,
} from "better-auth"
import nodemailer from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { parseUserAgent } from "../parse-user-agent"
import { NewLoginEmail } from "./new-login"
import { reactPasswordChangedEmail } from "./password-changed"
import { reactResetPasswordEmail } from "./reset-password"
import { reactVerifyEmail } from "./verify-email"
import { reactWelcomeEmail } from "./welcome"

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: process.env.MAIL_PORT,
    secureConnection: process.env.MAIL_USE_TLS,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  } as SMTPTransport.Options)

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to,
    subject,
    html,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch {
    return false
  }
}

type ExtendedMiddlewareContext = MiddlewareContext<
  MiddlewareOptions,
  AuthContext<BetterAuthOptions> & {
    returned?: unknown
    responseHeaders?: Headers
  }
>

export async function sendWelcomeEmail(user: User) {
  const loginLink = `${process.env.BETTER_AUTH_URL}/login`
  const html = await render(reactWelcomeEmail({ name: user.name, loginLink }))
  await sendMail(user.email, "Welcome to Nog", html)
}

export async function sendPasswordChangedEmail(
  userEmailOrCtx: string | ExtendedMiddlewareContext,
) {
  // Determinar el email y validar el contexto
  let userEmail: string

  if (typeof userEmailOrCtx === "string") {
    userEmail = userEmailOrCtx
  } else {
    const ctx = userEmailOrCtx
    const returned = ctx.context.returned

    if (returned instanceof APIError) {
      return
    }

    if (!ctx.context.session) {
      return
    }

    userEmail = ctx.context.session.user.email
  }

  const html = await render(
    reactPasswordChangedEmail({
      userEmail,
      timestamp: new Date().toISOString(),
      secureAccountLink: `${process.env.BETTER_AUTH_URL}/forgot-password`,
      appName: "Nog",
    }),
  )

  await sendMail(userEmail, "Password changed", html)
}
export async function sendNewLoginEmail(ctx: ExtendedMiddlewareContext) {
  const session = ctx.context.newSession?.session

  if (!session) return

  const user = await ctx?.context.internalAdapter.findUserById(session.userId)

  if (user) {
    const { browser, os, location, ipAddress } = parseUserAgent(session)

    const html = await render(
      NewLoginEmail({
        name: user.name,
        browser,
        os,
        location,
        ipAddress,
        timestamp: new Date().toISOString(),
        secureAccountLink: `${process.env.BETTER_AUTH_URL}/settings/sessions`,
      }),
    )
    await sendMail(user.email, "New login detected", html)
  }
}

export async function sendVerificationEmail(user: User, token: string) {
  const verifyLink = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`
  const html = await render(reactVerifyEmail({ name: user.name, verifyLink }))
  await sendMail(user.email, "Verify your email", html)
}

export async function sendResetPasswordEmail(user: User, token: string) {
  const resetLink = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`
  const html = await render(reactResetPasswordEmail({ name: user.name, resetLink }))
  await sendMail(user.email, "Reset your password", html)
}
