export type Invitation = {
  id: string
  email: string
  token: string
  status: string
  invitedBy: string | null
  invitedById: string | null
  invitedAt: Date
  expiresAt: Date
  acceptedAt: Date | null
  userId: string | null
}
