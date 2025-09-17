import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new mood entry
export const createMood = mutation({
  args: {
    mood: v.string(),
    intensity: v.number(),
    notes: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    detectionMethod: v.string(),
    metadata: v.optional(v.object({
      voiceMetrics: v.optional(v.object({
        tone: v.optional(v.string()),
        energy: v.optional(v.number()),
        stress: v.optional(v.number())
      })),
      visualMetrics: v.optional(v.object({
        facialExpression: v.optional(v.string()),
        eyeStrain: v.optional(v.number()),
        posture: v.optional(v.string())
      }))
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.db.insert("moods", {
      userId: user._id,
      mood: args.mood as any,
      intensity: args.intensity,
      notes: args.notes,
      triggers: args.triggers,
      detectionMethod: args.detectionMethod,
      metadata: args.metadata
    });
  },
});

// Get user's mood history
export const getUserMoods = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const moods = await ctx.db
      .query("moods")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return moods;
  },
});

// Get mood trends for dashboard
export const getMoodTrends = query({
  args: {
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { trends: [], averageMood: 0, moodDistribution: {} };
    }

    const daysBack = args.days || 30;
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    const moods = await ctx.db
      .query("moods")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
      .collect();

    // Calculate trends and statistics
    const moodValues = {
      "very_low": 1,
      "low": 2,
      "neutral": 3,
      "good": 4,
      "excellent": 5
    };

    const trends = moods.map(mood => ({
      date: new Date(mood._creationTime).toISOString().split('T')[0],
      mood: mood.mood,
      value: moodValues[mood.mood as keyof typeof moodValues] || 3,
      intensity: mood.intensity
    }));

    const averageMood = trends.length > 0 
      ? trends.reduce((sum, t) => sum + t.value, 0) / trends.length 
      : 3;

    const moodDistribution = moods.reduce((acc, mood) => {
      acc[mood.mood] = (acc[mood.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { trends, averageMood, moodDistribution };
  },
});

// Detect stress patterns
export const detectStressPatterns = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get recent moods and activities to detect patterns
    const recentMoods = await ctx.db
      .query("moods")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    // Simple pattern detection - look for consecutive low moods
    const patterns = [];
    let consecutiveLowMoods = 0;
    
    for (const mood of recentMoods) {
      if (mood.mood === "very_low" || mood.mood === "low") {
        consecutiveLowMoods++;
      } else {
        if (consecutiveLowMoods >= 3) {
          patterns.push({
            type: "consecutive_low_mood",
            severity: Math.min(consecutiveLowMoods, 10),
            recommendation: "Consider taking a break and trying a breathing exercise"
          });
        }
        consecutiveLowMoods = 0;
      }
    }

    return patterns;
  },
});
