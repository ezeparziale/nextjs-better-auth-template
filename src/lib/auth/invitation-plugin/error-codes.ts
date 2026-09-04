import { defineErrorCodes } from "better-auth"

export const INVITATION_ERROR_CODES = defineErrorCodes({
  USER_ALREADY_EXISTS: "User with this email already exists.",
  INVITATION_ALREADY_EXISTS: "A pending invitation for this email already exists.",
  INVITATION_NOT_FOUND: "Invitation not found.",
  INVITATION_EXPIRED: "Invitation has expired.",
  INVITATION_ALREADY_USED: "Invitation has already been used.",
  INVITATION_CANNOT_DELETE: "Only revoked or expired invitations can be deleted.",
})
