import { describe, expect, it } from "vitest"
import { buildFilterWhere } from "./filters"

const CONFIG = {
  isActive: { field: "isActive", kind: "bool" },
  role: { field: "role", kind: "list" },
  createdAt: { field: "createdAt", kind: "day" },
  createdFrom: { field: "createdAt", kind: "dateFrom" },
  createdTo: { field: "createdAt", kind: "dateTo" },
} as const

describe("buildFilterWhere", () => {
  it("maps a single boolean to an equality condition", () => {
    expect(buildFilterWhere({ isActive: true }, CONFIG)).toEqual([
      { field: "isActive", value: true },
    ])
    expect(buildFilterWhere({ isActive: [false] }, CONFIG)).toEqual([
      { field: "isActive", value: false },
    ])
  })

  it("treats a mix of true and false as no filter", () => {
    expect(buildFilterWhere({ isActive: [true, false] }, CONFIG)).toEqual([])
  })

  it("maps a list to an in-condition and a scalar to equality", () => {
    expect(buildFilterWhere({ role: ["admin", "user"] }, CONFIG)).toEqual([
      { field: "role", operator: "in", value: ["admin", "user"] },
    ])
    expect(buildFilterWhere({ role: "admin,user" }, CONFIG)).toEqual([
      { field: "role", operator: "in", value: ["admin", "user"] },
    ])
    expect(buildFilterWhere({ role: ["admin"] }, CONFIG)).toEqual([
      { field: "role", value: "admin" },
    ])
  })

  it("maps date ranges with inclusive from and exclusive to bounds", () => {
    expect(buildFilterWhere({ createdFrom: "2026-09-22" }, CONFIG)).toEqual([
      {
        field: "createdAt",
        operator: "gte",
        value: new Date("2026-09-22T00:00:00.000Z"),
      },
    ])
    expect(buildFilterWhere({ createdTo: "2026-09-22" }, CONFIG)).toEqual([
      {
        field: "createdAt",
        operator: "lt",
        value: new Date("2026-09-23T00:00:00.000Z"),
      },
    ])
  })

  it("maps a single day to a gte/lt pair covering the whole day", () => {
    expect(buildFilterWhere({ createdAt: "2026-09-22" }, CONFIG)).toEqual([
      {
        field: "createdAt",
        operator: "gte",
        value: new Date("2026-09-22T00:00:00.000Z"),
      },
      {
        field: "createdAt",
        operator: "lt",
        value: new Date("2026-09-23T00:00:00.000Z"),
      },
    ])
  })

  it("ignores absent, empty, unknown and malformed values", () => {
    expect(buildFilterWhere({}, CONFIG)).toEqual([])
    expect(buildFilterWhere({ banned: true }, CONFIG)).toEqual([])
    expect(buildFilterWhere({ role: [] }, CONFIG)).toEqual([])
    expect(buildFilterWhere({ createdAt: "2026-13-99" }, CONFIG)).toEqual([])
  })
})
