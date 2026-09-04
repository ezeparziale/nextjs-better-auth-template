# Invitation Plugin (Plugin de Invitaciones)

Invitation plugin for Better Auth

The Invitation plugin provides a set of administrative functions for inviting users to
join your application. It allows administrators to create, list, revoke, resend, and
delete user invitations by email, and validates the invitation when the invited user
signs up.

## Installation

<Steps>
  <Step>
    ### Add the plugin to your auth config

    To use the Invitation plugin, add it to your auth config.

    ```ts title="auth.ts"
    import { betterAuth } from "better-auth"
    import { invitationPlugin } from "@/lib/auth/invitation-plugin" // [!code highlight]

    export const auth = betterAuth({
        // ... other config options
        plugins: [
            invitationPlugin() // [!code highlight]
        ]
    })
    ```

  </Step>

  <Step>
    ### Migrate the database

    The plugin adds an `invitations` table. Create it by running a Prisma migration (or generate the schema).

    ```ts title="prisma/schema.prisma"
    model Invitation {
      id          String    @id
      email       String
      token       String    @unique
      status      String    @default("pending")
      invitedBy   String?   @map("invited_by")
      invitedById String?   @map("invited_by_id")
      invitedAt   DateTime  @default(now()) @map("invited_at")
      expiresAt   DateTime  @map("expires_at")
      acceptedAt  DateTime? @map("accepted_at")
      userId      String?   @map("user_id")

      @@index([email])
      @@index([status])
      @@index([expiresAt])
      @@map("invitations")
    }
    ```

    See the [Schema](#schema) section to add the fields manually.

  </Step>

  <Step>
    ### Add the client plugin

    Next, include the invitation client plugin in your authentication client instance.

    ```ts title="auth-client.ts"
    import { createAuthClient } from "better-auth/react"
    import { invitationClient } from "@/lib/auth/invitation-plugin/client"  // [!code highlight]

    export const authClient = createAuthClient({
        plugins: [
            invitationClient()  // [!code highlight]
        ]
    })
    ```

  </Step>
</Steps>

## Usage

The admin endpoints are protected: the user must be authenticated and have the `admin`
role.

To control whether the plugin is enabled globally, set `INVITATIONS_ENABLED` in your
environment. The plugin is **enabled by default** and only disabled when the variable is
explicitly `"false"`:

```ts title="auth.ts"
const INVITATIONS_ENABLED = (process.env.INVITATIONS_ENABLED ?? "true") !== "false"

export const auth = betterAuth({
  plugins: [...(INVITATIONS_ENABLED ? [invitationPlugin()] : [])],
})
```

### Create Invitation

Allows an admin to invite a user by email. An invitation email is sent with an
acceptance link that points to your sign-up page with the invitation token.

**Endpoint:** `POST /invitation/create`

### Client Side

```ts
const { data, error } = await authClient.invitation.create({
  email: "user@example.com", // required, The email of the user to invite.
  expiresInDays: 30, // Optional. Number of days the invitation is valid for. Defaults to the plugin config.
})
```

### Server Side

```ts
const data = await auth.api.invitationCreate({
  body: {
    email: "user@example.com", // required, The email of the user to invite.
    expiresInDays: 30, // Optional. Number of days the invitation is valid for.
  },
  // This endpoint requires session cookies.
  headers: await headers(),
})
```

### Type Definition

```ts
type invitationCreate = {
  /**
   * The email of the user to invite.
   */
  email: string = "user@example.com"
  /**
   * Number of days the invitation will be valid for. Defaults to the plugin config.
   */
  expiresInDays?: number = 30
}
```

### List Invitations

Allows an admin to list all invitations in the database, with pagination, email search,
and status filtering.

**Endpoint:** `GET /invitation/list`

### Client Side

```ts
const { data, error } = await authClient.invitation.list({
  query: {
    searchValue: "some@email.com", // The value to search by email.
    status: "pending", // Filter by status. Can be `all`, `pending`, `accepted`, `revoked` or `expired`.
    limit: 100, // The number of invitations to return.
    offset: 100, // The offset to start from.
    sortBy: "invitedAt", // The field to sort by.
    sortDirection: "desc", // The direction to sort by.
  },
})
```

### Server Side

```ts
const data = await auth.api.invitationList({
  query: {
    searchValue: "some@email.com",
    status: "pending",
    limit: 100,
    offset: 100,
    sortBy: "invitedAt",
    sortDirection: "desc",
  },
  // This endpoint requires session cookies.
  headers: await headers(),
})
```

### Type Definition

```ts
type invitationList = {
  /**
   * The value to search by email.
   */
  searchValue?: string
  /**
   * Filter by invitation status.
   */
  status?: "all" | "pending" | "accepted" | "revoked" | "expired" = "all"
  /**
   * The number of invitations to return.
   */
  limit?: string | number
  /**
   * The offset to start from.
   */
  offset?: string | number
  /**
   * The field to sort by.
   */
  sortBy?: string = "invitedAt"
  /**
   * The direction to sort by.
   */
  sortDirection?: "asc" | "desc" = "desc"
}
```

#### Returns

On success, `data` contains the list of invitations, the total count, and the pagination
metadata.

```ts
{
  invitations: Invitation[], // Array of returned invitations. Each invitation includes an `effectiveStatus` field that resolves `expired` for overdue `pending` rows.
  total: number,   // Total number of invitations after filters and search.
  limit: number,   // The limit provided in the query.
  offset: number   // The offset provided in the query.
}
```

> **Note:** Expiration is computed on the fly. A `pending` invitation whose `expiresAt`
> has passed is reported as `expired` in the effective status.

### Revoke Invitation

Revokes a pending invitation, invalidating its acceptance link.

**Endpoint:** `POST /invitation/revoke`

### Client Side

```ts
const { data, error } = await authClient.invitation.revoke({
  invitationId: "invitation-id", // required, The id of the invitation to revoke.
})
```

### Server Side

```ts
const data = await auth.api.invitationRevoke({
  body: {
    invitationId: "invitation-id", // required, The id of the invitation to revoke.
  },
  // This endpoint requires session cookies.
  headers: await headers(),
})
```

### Type Definition

```ts
type invitationRevoke = {
  /**
   * The id of the invitation to revoke.
   */
  invitationId: string = "invitation-id"
}
```

### Delete Invitation

Deletes a revoked or expired invitation. Pending and accepted invitations cannot be
deleted (they represent the active/used state).

**Endpoint:** `POST /invitation/delete`

### Client Side

```ts
const { data, error } = await authClient.invitation.delete({
  invitationId: "invitation-id", // required, The id of the invitation to delete.
})
```

### Server Side

```ts
const data = await auth.api.invitationDelete({
  body: {
    invitationId: "invitation-id", // required, The id of the invitation to delete.
  },
  // This endpoint requires session cookies.
  headers: await headers(),
})
```

### Type Definition

```ts
type invitationDelete = {
  /**
   * The id of the invitation to delete.
   */
  invitationId: string = "invitation-id"
}
```

### Resend Invitation

Re-sends the invitation email for a pending invitation. Only usable while the invitation
is still pending and not expired.

**Endpoint:** `POST /invitation/resend`

### Client Side

```ts
const { data, error } = await authClient.invitation.resend({
  invitationId: "invitation-id", // required, The id of the invitation to resend the email for.
})
```

### Server Side

```ts
const data = await auth.api.invitationResend({
  body: {
    invitationId: "invitation-id", // required, The id of the invitation to resend the email for.
  },
  // This endpoint requires session cookies.
  headers: await headers(),
})
```

### Type Definition

```ts
type invitationResend = {
  /**
   * The id of the invitation to resend the email for.
   */
  invitationId: string = "invitation-id"
}
```

## Acceptance Flow

The invited user follows the link in the invitation email (e.g.
`/signup?invitation=<token>`) and signs up with the invited email. The plugin validates
the invitation entirely through sign-up hooks, so there are **no public endpoints** to
enumerate or tamper with.

The sign-up page sends the invitation token as a custom header on the sign-up request:

```ts title="signup-form.tsx"
await signUp.email(
  {
    email: values.email,
    name: values.name,
    password: values.password,
  },
  {
    headers: {
      "x-invitation-token": invitation, // came from /signup?invitation=<token>
    },
  },
)
```

### Validation

Before the user is created, the plugin's `before` hook checks the header token:

- The token must match an existing invitation with status `pending`.
- The email used for sign-up **must match** the invited email.
- The invitation must not be **expired**.

If validation fails, the sign-up is **blocked** (the user is not created) and a
`BAD_REQUEST` is returned:

| Failure            | Message                               |
| ------------------ | ------------------------------------- |
| Expired invitation | `This invitation has expired.`        |
| Any other failure  | `Invitation error. Please try again.` |

Only the expired case reveals a specific message; everything else (not found, revoked,
accepted, email mismatch) uses the generic message to avoid leaking which emails were
invited.

### Marking as Accepted

After the user signs up successfully, the plugin's `after` hook marks the invitation as
`accepted`, recording the new `userId` and `acceptedAt`. This works even when
`requireEmailVerification` is enabled (the user is created but not yet verified).

## Rate Limit

The plugin ships rate limiting for the admin endpoints using Better Auth's built-in rate
limiter. Configure it in your global `rateLimit` options:

| Endpoint             | Limit       | Window |
| -------------------- | ----------- | ------ |
| `/invitation/create` | 10 requests | 60s    |
| `/invitation/resend` | 5 requests  | 60s    |

## Schema

The plugin adds a single `invitations` table:

| Field         | Type      | Notes                                                                                                              |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`          | `string`  | Primary key.                                                                                                       |
| `email`       | `string`  | Indexed. The invited email (normalized lowercase).                                                                 |
| `token`       | `string`  | Unique. Opaque UUIDv4 used in the acceptance link.                                                                 |
| `status`      | `string`  | Indexed. `pending`, `accepted`, `revoked`, `expired`. Defaults to `pending`. `expired` is computed, not persisted. |
| `invitedBy`   | `string?` | Email of the admin who created the invitation.                                                                     |
| `invitedById` | `string?` | Id of the admin who created the invitation. Relation to `User` with `ON DELETE SET NULL`.                          |
| `invitedAt`   | `date`    | When the invitation was created.                                                                                   |
| `expiresAt`   | `date`    | Indexed. When the invitation expires.                                                                              |
| `acceptedAt`  | `date?`   | When the invitation was accepted.                                                                                  |
| `userId`      | `string?` | Id of the user who accepted the invitation.                                                                        |

Multiple invitations for the same email are allowed and kept as history (only one
`pending` invitation per email at a time).

## Options

### expiresInDays

The default number of days an invitation is valid for. Defaults to `30`.

```ts title="auth.ts"
invitationPlugin({
  expiresInDays: 14, // invitations expire after 14 days by default
})
```

Invitations created via the API can override this value per request through the
`expiresInDays` body field.
