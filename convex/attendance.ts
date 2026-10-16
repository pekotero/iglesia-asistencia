import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    date: v.string(),
    title: v.optional(v.string()),
    records: v.array(
      v.object({
        memberId: v.id("members"),
        memberName: v.string(),
        present: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const totalPresent = args.records.filter((r) => r.present).length;
    const totalAbsent = args.records.filter((r) => !r.present).length;
    return await ctx.db.insert("attendance", {
      date: args.date,
      title: args.title || "Reunión General",
      records: args.records,
      totalPresent,
      totalAbsent,
      createdAt: Date.now(),
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance").order("desc").collect();
  },
});

export const remove = mutation({
  args: { id: v.id("attendance") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});