import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  members: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    group: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }),

  attendance: defineTable({
    date: v.string(),
    title: v.optional(v.string()),
    records: v.array(
      v.object({
        memberId: v.id("members"),
        memberName: v.string(),
        present: v.boolean(),
      })
    ),
    totalPresent: v.number(),
    totalAbsent: v.number(),
    createdAt: v.number(),
  }),
});