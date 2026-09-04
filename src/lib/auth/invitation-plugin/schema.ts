import type { BetterAuthPlugin } from "better-auth"

export const schema = {
  invitation: {
    modelName: "invitation",
    fields: {
      email: {
        type: "string",
        required: true,
        index: true,
      },
      token: {
        type: "string",
        required: true,
        unique: true,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "pending",
        index: true,
      },
      invitedBy: {
        type: "string",
        required: false,
        fieldName: "invitedBy",
      },
      invitedById: {
        type: "string",
        required: false,
        fieldName: "invitedById",
      },
      invitedAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "invitedAt",
      },
      expiresAt: {
        type: "date",
        required: true,
        index: true,
        fieldName: "expiresAt",
      },
      acceptedAt: {
        type: "date",
        required: false,
        fieldName: "acceptedAt",
      },
      userId: {
        type: "string",
        required: false,
        fieldName: "userId",
      },
    },
  },
} satisfies BetterAuthPlugin["schema"]

export type InvitationSchema = typeof schema
