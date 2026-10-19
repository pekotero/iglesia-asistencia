import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("meetingTypes").collect();
    return types.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const clean = args.name.trim();
    if (!clean) return;
    const existing = await ctx.db.query("meetingTypes").collect();
    if (existing.some((t) => t.name.toLowerCase() === clean.toLowerCase())) return;
    await ctx.db.insert("meetingTypes", { name: clean, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("meetingTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});