import type { AuthContext } from "better-auth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PERMISSION_KEY_PATTERN, ROLE_KEY_PATTERN } from "../rbac-patterns"
import { seedRBACData } from "./seed"
import { createFakeAdapter, type FakeAdapter } from "./test-helpers"
import type { RBACPluginOptions } from "./types"

const validationOptions = {
  permission: {
    minLength: 5,
    maxLength: 50,
    pattern: PERMISSION_KEY_PATTERN,
  },
  role: { minLength: 3, maxLength: 50, pattern: ROLE_KEY_PATTERN },
}

const SEED: Required<Pick<RBACPluginOptions, "seedPermissions" | "seedRoles">> = {
  seedPermissions: [
    { key: "user.read", name: "Read users", description: "Can view users." },
    { key: "user.manage", name: "Manage users", description: "Can edit users." },
  ],
  seedRoles: [
    {
      key: "admin",
      name: "Administrator",
      description: "Full access.",
      permissions: ["user.read", "user.manage"],
    },
    {
      key: "member",
      name: "Member",
      description: "Read only.",
      permissions: ["user.read"],
    },
  ],
}

const run = (fake: FakeAdapter) =>
  seedRBACData(
    { adapter: fake.adapter } as unknown as AuthContext,
    SEED,
    validationOptions,
  )

describe("seedRBACData", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("seeds every permission and role, then links the permissions to each role", async () => {
    const fake = createFakeAdapter({ transaction: "supported" })

    await run(fake)

    expect(fake.rowsOf("permission").map((row) => row.key)).toEqual([
      "user.read",
      "user.manage",
    ])
    expect(fake.rowsOf("role").map((row) => row.key)).toEqual(["admin", "member"])

    const [admin] = fake.rowsOf("role")
    const permissionId = (key: string) =>
      fake.rowsOf("permission").find((row) => row.key === key)?.id

    expect(
      fake
        .rowsOf("rolePermission")
        .filter((row) => row.roleId === admin.id)
        .map((row) => row.permissionId)
        .sort(),
    ).toEqual([permissionId("user.manage"), permissionId("user.read")].sort())

    expect(fake.commits()).toBe(1)
    expect(fake.rollbacks()).toBe(0)
  })

  it("marks seeded entities as system so they cannot be deleted afterwards", async () => {
    const fake = createFakeAdapter({ transaction: "supported" })

    await run(fake)

    expect(fake.rowsOf("role").every((row) => row.isSystem === true)).toBe(true)
    expect(fake.rowsOf("permission").every((row) => row.isSystem === true)).toBe(true)
  })

  it("skips permissions and roles that already exist instead of failing", async () => {
    const fake = createFakeAdapter({
      transaction: "supported",
      rows: [
        { __model: "permission", id: "perm_1", key: "user.read" },
        { __model: "role", id: "role_1", key: "admin" },
      ],
    })

    await run(fake)

    expect(fake.countOf("create", "permission")).toBe(1)
    expect(fake.countOf("create", "role")).toBe(1)
    expect(fake.rowsOf("role").map((row) => row.key)).toEqual(["admin", "member"])
  })

  it("rolls back the whole seed when a write fails halfway", async () => {
    const fake = createFakeAdapter({
      transaction: "supported",
      failOn: (row) => row.key === "member",
    })
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(run(fake)).rejects.toThrow("unique constraint")

    expect(fake.rollbacks()).toBe(1)
    expect(fake.commits()).toBe(0)
    expect(fake.rowsOf("permission")).toEqual([])
    expect(fake.rowsOf("role")).toEqual([])
    expect(fake.rowsOf("rolePermission")).toEqual([])
    expect(logged).toHaveBeenCalled()
  })

  it("keeps the rows it already wrote when the adapter has no transactions", async () => {
    const fake = createFakeAdapter({
      transaction: "unsupported",
      failOn: (row) => row.key === "member",
    })
    vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(run(fake)).rejects.toThrow("unique constraint")

    expect(fake.rollbacks()).toBe(0)
    expect(fake.rowsOf("permission").map((row) => row.key)).toEqual([
      "user.read",
      "user.manage",
    ])
    expect(fake.rowsOf("role").map((row) => row.key)).toEqual(["admin"])
  })

  it("rejects the whole seed when a key does not match the configured pattern", async () => {
    const fake = createFakeAdapter({ transaction: "supported" })
    const bad = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      seedRBACData(
        { adapter: fake.adapter } as unknown as AuthContext,
        { ...SEED, seedRoles: [{ key: "Not A Role", name: "x", description: "x" }] },
        validationOptions,
      ),
    ).rejects.toThrow("Invalid seed configuration")

    expect(fake.commits()).toBe(0)
    expect(fake.countOf("create")).toBe(0)
    expect(bad).not.toHaveBeenCalled()
  })
})
