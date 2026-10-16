import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
    return members.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    group: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("members", {
      name: args.name,
      phone: args.phone || "",
      group: args.group || "General",
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const addBulk = mutation({
  args: {
    members: v.array(
      v.object({
        name: v.string(),
        phone: v.optional(v.string()),
        group: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const member of args.members) {
      await ctx.db.insert("members", {
        name: member.name,
        phone: member.phone || "",
        group: member.group || "General",
        active: true,
        createdAt: Date.now(),
      });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    name: v.string(),
    phone: v.optional(v.string()),
    group: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      phone: args.phone,
      group: args.group,
    });
  },
});

export const deactivate = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { active: false });
  },
});