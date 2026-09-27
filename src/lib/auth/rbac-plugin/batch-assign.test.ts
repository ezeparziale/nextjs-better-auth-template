import type { DBAdapter } from "better-auth"
import { describe, expect, it } from "vitest"
import { assignBatch } from "./batch-assign"
import { createFakeAdapter, type FakeRow } from "./test-helpers"

const TARGET = { targetField: "roleId", targetValue: "role_1" }

describe("assignBatch", () => {
  it("returns zeroed counts without touching the database for an empty batch", async () => {
    const fake = createFakeAdapter({})

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: [],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 0, skippedCount: 0 })
    expect(fake.calls).toHaveLength(0)
  })

  it("assigns every item with a single batched read and one insert per item", async () => {
    const fake = createFakeAdapter({})

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2", "user_3"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 3, skippedCount: 0 })
    expect(fake.countOf("findMany")).toBe(1)
    expect(fake.countOf("findOne")).toBe(0)
    expect(fake.countOf("create")).toBe(3)
  })

  it("skips already assigned items without inserting them", async () => {
    const fake = createFakeAdapter({
      rows: [
        { __model: "userRole", userId: "user_2", roleId: "role_1" },
        { __model: "userRole", userId: "user_3", roleId: "role_1" },
      ],
    })

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2", "user_3"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 1, skippedCount: 2 })
    expect(fake.countOf("create")).toBe(1)
  })

  it("counts counts adding up to the requested batch size", async () => {
    const fake = createFakeAdapter({
      rows: [{ __model: "userRole", userId: "user_1", roleId: "role_1" }],
    })

    const itemIds = ["user_1", "user_2", "user_3", "user_4"]

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds,
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result.assignedCount + result.skippedCount).toBe(itemIds.length)
  })

  it("does not read per item when everything is already assigned", async () => {
    const fake = createFakeAdapter({
      rows: [
        { __model: "userRole", userId: "user_1", roleId: "role_1" },
        { __model: "userRole", userId: "user_2", roleId: "role_1" },
      ],
    })

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 0, skippedCount: 2 })
    expect(fake.countOf("findMany")).toBe(1)
    expect(fake.countOf("create")).toBe(0)
  })

  it("counts an item as skipped when a concurrent writer won the race", async () => {
    const fake = createFakeAdapter({
      failOn: (row) => row.userId === "user_2",
      rows: [],
    })

    const originalCreate = fake.adapter.create
    const adapter = {
      ...fake.adapter,
      create: async (args: { model: string; data: FakeRow }) => {
        if (args.data.userId === "user_2") {
          fake.rows.push({ __model: "userRole", ...args.data })
        }
        return originalCreate(args)
      },
    } as unknown as DBAdapter

    const result = await assignBatch({
      adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2", "user_3"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 2, skippedCount: 1 })
  })

  it("rethrows the original error when the failed insert left no row behind", async () => {
    const fake = createFakeAdapter({ failOn: (row) => row.userId === "user_2" })

    await expect(
      assignBatch({
        adapter: fake.adapter,
        model: "userRole",
        ...TARGET,
        itemField: "userId",
        itemIds: ["user_1", "user_2", "user_3"],
        buildData: (userId) => ({ userId, roleId: "role_1" }),
      }),
    ).rejects.toThrow("unique constraint")
  })

  it("leaves the inserts that already happened when the adapter has no transactions", async () => {
    const fake = createFakeAdapter({
      transaction: "unsupported",
      failOn: (row) => row.userId === "user_2",
    })

    await expect(
      assignBatch({
        adapter: fake.adapter,
        model: "userRole",
        ...TARGET,
        itemField: "userId",
        itemIds: ["user_1", "user_2", "user_3"],
        buildData: (userId) => ({ userId, roleId: "role_1" }),
        concurrency: 1,
      }),
    ).rejects.toThrow("unique constraint")

    expect(fake.commits()).toBe(0)
    expect(fake.rollbacks()).toBe(0)
    expect(fake.rowsOf("userRole").map((row) => row.userId)).toEqual(["user_1"])
  })

  it("wraps the batch in a transaction when the adapter supports it", async () => {
    const fake = createFakeAdapter({ transaction: "supported" })

    await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(fake.openTransactions()).toBe(0)
    expect(fake.commits()).toBe(1)
    expect(fake.countOf("findMany")).toBe(1)
  })

  it("rolls the whole batch back when one insert fails mid-transaction", async () => {
    const fake = createFakeAdapter({
      transaction: "supported",
      failOn: (row) => row.userId === "user_2",
    })

    await expect(
      assignBatch({
        adapter: fake.adapter,
        model: "userRole",
        ...TARGET,
        itemField: "userId",
        itemIds: ["user_1", "user_2", "user_3"],
        buildData: (userId) => ({ userId, roleId: "role_1" }),
      }),
    ).rejects.toThrow("unique constraint")

    expect(fake.rollbacks()).toBe(1)
    expect(fake.commits()).toBe(0)
    expect(fake.rowsOf("userRole")).toEqual([])
  })

  it("runs against the adapter directly when the adapter has no transactions", async () => {
    const fake = createFakeAdapter({ transaction: "unsupported" })

    const result = await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds: ["user_1", "user_2"],
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(result).toEqual({ assignedCount: 2, skippedCount: 0 })
    expect(fake.openTransactions()).toBe(0)
  })

  it("bounds the number of concurrent inserts", async () => {
    const fake = createFakeAdapter({})

    const itemIds = Array.from({ length: 25 }, (_, index) => `user_${index}`)

    await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds,
      buildData: (userId) => ({ userId, roleId: "role_1" }),
      concurrency: 4,
    })

    expect(fake.maxParallelCreates()).toBeLessThanOrEqual(4)
    expect(fake.maxParallelCreates()).toBeGreaterThan(1)
  })

  it("defaults to a bounded concurrency of 10", async () => {
    const fake = createFakeAdapter({})

    const itemIds = Array.from({ length: 30 }, (_, index) => `user_${index}`)

    await assignBatch({
      adapter: fake.adapter,
      model: "userRole",
      ...TARGET,
      itemField: "userId",
      itemIds,
      buildData: (userId) => ({ userId, roleId: "role_1" }),
    })

    expect(fake.maxParallelCreates()).toBeLessThanOrEqual(10)
  })
})
