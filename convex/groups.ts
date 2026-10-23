import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const clean = args.name.trim();
    if (!clean) return;
    const existing = await ctx.db.query("groups").collect();
    if (existing.some((g) => g.name.toLowerCase() === clean.toLowerCase())) return;
    await ctx.db.insert("groups", { name: clean, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
