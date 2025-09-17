import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get available knowledge cards for user
export const getAvailableKnowledgeCards = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    let query = ctx.db.query("knowledgeCards").withIndex("by_public", (q) => q.eq("isPublic", true));
    
    if (args.category) {
      query = ctx.db.query("knowledgeCards").withIndex("by_category", (q) => q.eq("category", args.category as string));
    }

    const cards = await query.take(args.limit || 20);

    if (!user) {
      return cards.map(card => ({ ...card, unlocked: false, completed: false }));
    }

    // Get user's progress on these cards
    const userProgress = await ctx.db
      .query("userKnowledgeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const progressMap = new Map(userProgress.map(p => [p.cardId, p]));

    // Check unlock requirements
    const userStats = {
      activitiesCompleted: user.totalActivitiesCompleted || 0,
      groveLevel: user.groveLevel || 1,
      journalEntries: 0 // Would get from journals
    };

    return cards.map(card => {
      const progress = progressMap.get(card._id);
      const unlocked = progress?.unlocked || 
        !card.unlockRequirements ||
        ((!card.unlockRequirements.activitiesCompleted || userStats.activitiesCompleted >= card.unlockRequirements.activitiesCompleted) &&
         (!card.unlockRequirements.groveLevel || userStats.groveLevel >= card.unlockRequirements.groveLevel) &&
         (!card.unlockRequirements.journalEntries || userStats.journalEntries >= card.unlockRequirements.journalEntries));

      return {
        ...card,
        unlocked,
        completed: progress?.completed || false,
        rating: progress?.rating
      };
    });
  },
});

// Unlock knowledge card
export const unlockKnowledgeCard = mutation({
  args: {
    cardId: v.id("knowledgeCards")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if already unlocked
    const existing = await ctx.db
      .query("userKnowledgeProgress")
      .withIndex("by_user_and_card", (q) => q.eq("userId", user._id).eq("cardId", args.cardId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("userKnowledgeProgress", {
      userId: user._id,
      cardId: args.cardId,
      unlocked: true,
      completed: false
    });
  },
});

// Mark knowledge card as completed
export const completeKnowledgeCard = mutation({
  args: {
    cardId: v.id("knowledgeCards"),
    rating: v.optional(v.number()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const progress = await ctx.db
      .query("userKnowledgeProgress")
      .withIndex("by_user_and_card", (q) => q.eq("userId", user._id).eq("cardId", args.cardId))
      .unique();

    if (progress) {
      await ctx.db.patch(progress._id, {
        completed: true,
        rating: args.rating,
        notes: args.notes
      });
      return progress._id;
    } else {
      return await ctx.db.insert("userKnowledgeProgress", {
        userId: user._id,
        cardId: args.cardId,
        unlocked: true,
        completed: true,
        rating: args.rating,
        notes: args.notes
      });
    }
  },
});

// Seed initial knowledge cards
export const seedKnowledgeCards = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCards = await ctx.db.query("knowledgeCards").take(1);
    if (existingCards.length > 0) {
      return "Knowledge cards already seeded";
    }

    const cards = [
      {
        title: "Understanding Academic Stress",
        content: "Academic stress is a common experience for students. Learn about its causes, symptoms, and healthy coping strategies. This guide covers time management, study techniques, and when to seek help.",
        category: "stress",
        difficulty: "beginner",
        estimatedReadTime: 5,
        tags: ["stress", "academic", "coping"],
        isPublic: true,
        likes: 0,
        views: 0
      },
      {
        title: "Mindful Breathing Techniques",
        content: "Discover the power of breath in managing stress and anxiety. This comprehensive guide covers various breathing techniques including 4-7-8 breathing, box breathing, and diaphragmatic breathing.",
        category: "mindfulness",
        difficulty: "beginner",
        estimatedReadTime: 8,
        tags: ["breathing", "mindfulness", "anxiety"],
        unlockRequirements: {
          activitiesCompleted: 1
        },
        isPublic: true,
        likes: 0,
        views: 0
      },
      {
        title: "Building Resilience in College",
        content: "Resilience is the ability to bounce back from challenges. Learn practical strategies to build mental resilience, including cognitive reframing, social support, and self-care practices.",
        category: "wellness",
        difficulty: "intermediate",
        estimatedReadTime: 12,
        tags: ["resilience", "mental health", "college"],
        unlockRequirements: {
          activitiesCompleted: 5,
          groveLevel: 2
        },
        isPublic: true,
        likes: 0,
        views: 0
      },
      {
        title: "Meditation for Beginners",
        content: "Start your meditation journey with simple, effective techniques. This guide covers sitting meditation, walking meditation, and how to establish a daily practice.",
        category: "mindfulness",
        difficulty: "beginner",
        estimatedReadTime: 10,
        tags: ["meditation", "mindfulness", "practice"],
        culturalRelevance: ["indian", "buddhist", "universal"],
        isPublic: true,
        likes: 0,
        views: 0
      },
      {
        title: "Ayurvedic Wellness for Students",
        content: "Explore ancient Indian wisdom for modern student life. Learn about doshas, daily routines (dinacharya), and Ayurvedic practices for mental clarity and emotional balance.",
        category: "wellness",
        difficulty: "intermediate",
        estimatedReadTime: 15,
        tags: ["ayurveda", "indian", "holistic"],
        culturalRelevance: ["indian"],
        unlockRequirements: {
          activitiesCompleted: 3
        },
        isPublic: true,
        likes: 0,
        views: 0
      }
    ];

    const insertedIds = [];
    for (const card of cards) {
      const id = await ctx.db.insert("knowledgeCards", card);
      insertedIds.push(id);
    }

    return `Seeded ${insertedIds.length} knowledge cards`;
  },
});
