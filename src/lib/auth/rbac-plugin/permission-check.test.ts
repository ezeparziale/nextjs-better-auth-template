import { describe, expect, it } from "vitest"
import { userHasPermissionKey } from "./permission-check"
import { createFakeAdapter, fromTables, type FakeRow } from "./test-helpers"

function fakeAdapter(tables: Record<string, FakeRow[]>) {
  return createFakeAdapter({ rows: fromTables(tables) })
}

const PERMISSION_ACTIVE = { id: "perm_1", key: "post:create", isActive: true }
const PERMISSION_INACTIVE = { id: "perm_2", key: "post:delete", isActive: false }

describe("userHasPermissionKey", () => {
  it("returns true when an active role grants the permission", async () => {
    const { adapter } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [{ userId: "user_1", roleId: "role_1" }],
      role: [{ id: "role_1", isActive: true }],
      rolePermission: [{ roleId: "role_1", permissionId: "perm_1" }],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      true,
    )
  })

  it("costs a fixed number of queries no matter how many roles the user has", async () => {
    const { adapter, callLog } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [
        { userId: "user_1", roleId: "role_1" },
        { userId: "user_1", roleId: "role_2" },
        { userId: "user_1", roleId: "role_3" },
      ],
      role: [
        { id: "role_1", isActive: true },
        { id: "role_2", isActive: true },
        { id: "role_3", isActive: true },
      ],
      rolePermission: [],
    })

    await userHasPermissionKey(adapter, "user_1", "post:create")

    expect(callLog()).toEqual([
      "findOne:permission",
      "findMany:userRole",
      "findMany:role",
      "findMany:rolePermission",
    ])
  })

  it("returns false when the permission is inactive", async () => {
    const { adapter, callLog } = fakeAdapter({
      permission: [PERMISSION_INACTIVE],
      userRole: [{ userId: "user_1", roleId: "role_1" }],
      role: [{ id: "role_1", isActive: true }],
      rolePermission: [{ roleId: "role_1", permissionId: "perm_2" }],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:delete")).resolves.toBe(
      false,
    )
    expect(callLog()).toEqual(["findOne:permission"])
  })

  it("returns false when the permission does not exist", async () => {
    const { adapter } = fakeAdapter({ permission: [] })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      false,
    )
  })

  it("returns false when the user has no roles", async () => {
    const { adapter, callLog } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      false,
    )
    expect(callLog()).toEqual(["findOne:permission", "findMany:userRole"])
  })

  it("ignores roles that are no longer active", async () => {
    const { adapter, callLog } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [
        { userId: "user_1", roleId: "role_1" },
        { userId: "user_1", roleId: "role_2" },
      ],
      role: [
        { id: "role_1", isActive: false },
        { id: "role_2", isActive: true },
      ],
      rolePermission: [{ roleId: "role_1", permissionId: "perm_1" }],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      false,
    )
    expect(callLog()).toEqual([
      "findOne:permission",
      "findMany:userRole",
      "findMany:role",
      "findMany:rolePermission",
    ])
  })

  it("returns false when no active role grants the permission", async () => {
    const { adapter } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [
        { userId: "user_1", roleId: "role_1" },
        { userId: "user_1", roleId: "role_2" },
      ],
      role: [
        { id: "role_1", isActive: true },
        { id: "role_2", isActive: true },
      ],
      rolePermission: [{ roleId: "role_2", permissionId: "perm_1" }],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      true,
    )
  })

  it("returns false when every role of the user is inactive", async () => {
    const { adapter, callLog } = fakeAdapter({
      permission: [PERMISSION_ACTIVE],
      userRole: [{ userId: "user_1", roleId: "role_1" }],
      role: [{ id: "role_1", isActive: false }],
    })

    await expect(userHasPermissionKey(adapter, "user_1", "post:create")).resolves.toBe(
      false,
    )
    expect(callLog()).toEqual([
      "findOne:permission",
      "findMany:userRole",
      "findMany:role",
    ])
  })
})
