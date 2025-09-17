import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new activity session
export const createActivity = mutation({
  args: {
    type: v.string(),
    duration: v.number(),
    completed: v.boolean(),
    effectiveness: v.optional(v.number()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({
      breathingPattern: v.optional(v.string()),
      musicTrack: v.optional(v.string()),
      guidanceUsed: v.optional(v.boolean()),
      interruptions: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const activityId = await ctx.db.insert("activities", {
      userId: user._id,
      type: args.type as any,
      duration: args.duration,
      completed: args.completed,
      effectiveness: args.effectiveness,
      notes: args.notes,
      metadata: args.metadata
    });

    // Update user's total activities completed
    if (args.completed) {
      await ctx.db.patch(user._id, {
        totalActivitiesCompleted: (user.totalActivitiesCompleted || 0) + 1
      });
    }

    return activityId;
  },
});

// Get user's activity history
export const getUserActivities = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    let query = ctx.db.query("activities").withIndex("by_user", (q) => q.eq("userId", user._id));
    
    if (args.type) {
      query = ctx.db.query("activities").withIndex("by_user_and_type", (q) => 
        q.eq("userId", user._id).eq("type", args.type as any)
      );
    }

    const activities = await query
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

// Get activity statistics for dashboard
export const getActivityStats = query({
  args: {
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalActivities: 0,
        completedActivities: 0,
        averageDuration: 0,
        streakDays: 0,
        activityBreakdown: {}
      };
    }

    const daysBack = args.days || 30;
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
      .collect();

    const completedActivities = activities.filter(a => a.completed);
    const totalDuration = completedActivities.reduce((sum, a) => sum + a.duration, 0);
    
    const activityBreakdown = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate streak (simplified - consecutive days with activities)
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const hasActivityToday = activities.some(a => 
      new Date(a._creationTime).toDateString() === today && a.completed
    );
    const hasActivityYesterday = activities.some(a => 
      new Date(a._creationTime).toDateString() === yesterday && a.completed
    );

    let streakDays = user.streakDays || 0;
    if (hasActivityToday && !hasActivityYesterday) {
      streakDays = 1;
    } else if (hasActivityToday && hasActivityYesterday) {
      streakDays = streakDays + 1;
    } else if (!hasActivityToday) {
      streakDays = 0;
    }

    // Update user streak - remove this line as queries can't patch
    // The streak will be calculated each time

    return {
      totalActivities: activities.length,
      completedActivities: completedActivities.length,
      averageDuration: completedActivities.length > 0 ? totalDuration / completedActivities.length : 0,
      streakDays,
      activityBreakdown
    };
  },
});

// Get personalized activity recommendations
export const getActivityRecommendations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get recent mood and activity data
    const recentMoods = await ctx.db
      .query("moods")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(5);

    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    // Simple recommendation logic
    const recommendations = [];
    
    const latestMood = recentMoods[0];
    if (latestMood) {
      if (latestMood.mood === "very_low" || latestMood.mood === "low") {
        recommendations.push({
          type: "breathing",
          title: "Quick Breathing Exercise",
          description: "A 5-minute breathing exercise to help you feel more centered",
          duration: 5,
          priority: "high"
        });
      } else if (latestMood.mood === "neutral") {
        recommendations.push({
          type: "meditation",
          title: "Mindful Meditation",
          description: "A gentle 10-minute meditation to enhance your wellbeing",
          duration: 10,
          priority: "medium"
        });
      }
    }

    // Check if user hasn't done activities recently
    const lastActivity = recentActivities[0];
    if (!lastActivity || (Date.now() - lastActivity._creationTime) > 24 * 60 * 60 * 1000) {
      recommendations.push({
        type: "journaling",
        title: "Daily Check-in",
        description: "Take a moment to reflect on your day and feelings",
        duration: 10,
        priority: "medium"
      });
    }

    return recommendations;
  },
});
