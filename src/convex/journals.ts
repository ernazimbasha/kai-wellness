import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new journal entry
export const createJournal = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isEncrypted: v.boolean(),
    researchConsent: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Simple sentiment analysis (in real app, would use AI service)
    const sentiment = {
      score: Math.random() * 2 - 1, // -1 to 1
      confidence: Math.random(),
      emotions: ["calm", "reflective"] // placeholder
    };

    return await ctx.db.insert("journals", {
      userId: user._id,
      title: args.title,
      content: args.content,
      type: args.type as any,
      mood: args.mood as any,
      tags: args.tags,
      isEncrypted: args.isEncrypted,
      wordCount: args.content.split(' ').length,
      sentiment,
      researchConsent: args.researchConsent
    });
  },
});

// Get user's journal entries
export const getUserJournals = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    let query = ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", user._id));
    
    if (args.type) {
      query = ctx.db.query("journals").withIndex("by_user_and_type", (q) => 
        q.eq("userId", user._id).eq("type", args.type as any)
      );
    }

    const journals = await query
      .order("desc")
      .take(args.limit || 20);

    return journals;
  },
});

// Get journal statistics
export const getJournalStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalEntries: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        entriesThisWeek: 0,
        sentimentTrend: []
      };
    }

    const journals = await ctx.db
      .query("journals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const totalWords = journals.reduce((sum, j) => sum + j.wordCount, 0);
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const entriesThisWeek = journals.filter(j => j._creationTime >= weekAgo).length;

    const sentimentTrend = journals
      .slice(0, 10)
      .map(j => ({
        date: new Date(j._creationTime).toISOString().split('T')[0],
        sentiment: j.sentiment?.score || 0
      }));

    return {
      totalEntries: journals.length,
      totalWords,
      averageWordsPerEntry: journals.length > 0 ? totalWords / journals.length : 0,
      entriesThisWeek,
      sentimentTrend
    };
  },
});

// Get research journals (anonymized)
export const getResearchJournals = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const journals = await ctx.db
      .query("journals")
      .withIndex("by_research_consent", (q) => q.eq("researchConsent", true))
      .order("desc")
      .take(args.limit || 50);

    // Return anonymized data
    return journals.map(j => ({
      id: j._id,
      content: j.content,
      mood: j.mood,
      tags: j.tags,
      wordCount: j.wordCount,
      sentiment: j.sentiment,
      createdAt: j._creationTime
    }));
  },
});
