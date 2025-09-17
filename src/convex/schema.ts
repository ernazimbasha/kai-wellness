import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Mood tracking enums
export const MOOD_TYPES = {
  VERY_LOW: "very_low",
  LOW: "low", 
  NEUTRAL: "neutral",
  GOOD: "good",
  EXCELLENT: "excellent"
} as const;

export const moodValidator = v.union(
  v.literal(MOOD_TYPES.VERY_LOW),
  v.literal(MOOD_TYPES.LOW),
  v.literal(MOOD_TYPES.NEUTRAL),
  v.literal(MOOD_TYPES.GOOD),
  v.literal(MOOD_TYPES.EXCELLENT)
);

// Activity types
export const ACTIVITY_TYPES = {
  BREATHING: "breathing",
  MEDITATION: "meditation", 
  JOURNALING: "journaling",
  MUSIC: "music",
  MINDFULNESS: "mindfulness"
} as const;

export const activityTypeValidator = v.union(
  v.literal(ACTIVITY_TYPES.BREATHING),
  v.literal(ACTIVITY_TYPES.MEDITATION),
  v.literal(ACTIVITY_TYPES.JOURNALING),
  v.literal(ACTIVITY_TYPES.MUSIC),
  v.literal(ACTIVITY_TYPES.MINDFULNESS)
);

// Journal types
export const JOURNAL_TYPES = {
  PRIVATE: "private",
  RESEARCH: "research"
} as const;

export const journalTypeValidator = v.union(
  v.literal(JOURNAL_TYPES.PRIVATE),
  v.literal(JOURNAL_TYPES.RESEARCH)
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      
      // Kai-specific user fields
      studentLevel: v.optional(v.string()), // undergraduate, graduate, etc
      studyField: v.optional(v.string()), // field of study
      stressLevel: v.optional(v.number()), // 1-10 stress level
      onboardingCompleted: v.optional(v.boolean()),
      groveLevel: v.optional(v.number()), // garden level progression
      totalActivitiesCompleted: v.optional(v.number()),
      streakDays: v.optional(v.number()),
      lastActiveDate: v.optional(v.string()),
      preferences: v.optional(v.object({
        musicGenre: v.optional(v.string()),
        reminderTime: v.optional(v.string()),
        culturalBackground: v.optional(v.string()),
        privacySettings: v.optional(v.object({
          allowVoiceAnalysis: v.optional(v.boolean()),
          allowCameraAnalysis: v.optional(v.boolean()),
          shareResearchData: v.optional(v.boolean())
        }))
      }))
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Mood tracking
    moods: defineTable({
      userId: v.id("users"),
      mood: moodValidator,
      intensity: v.number(), // 1-10
      notes: v.optional(v.string()),
      triggers: v.optional(v.array(v.string())), // stress triggers
      detectionMethod: v.string(), // "manual", "voice", "visual", "text"
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
    }).index("by_user", ["userId"]),

    // Activity sessions
    activities: defineTable({
      userId: v.id("users"),
      type: activityTypeValidator,
      duration: v.number(), // in minutes
      completed: v.boolean(),
      effectiveness: v.optional(v.number()), // 1-10 user rating
      notes: v.optional(v.string()),
      metadata: v.optional(v.object({
        breathingPattern: v.optional(v.string()),
        musicTrack: v.optional(v.string()),
        guidanceUsed: v.optional(v.boolean()),
        interruptions: v.optional(v.number())
      }))
    }).index("by_user", ["userId"])
      .index("by_user_and_type", ["userId", "type"]),

    // Journal entries
    journals: defineTable({
      userId: v.id("users"),
      title: v.string(),
      content: v.string(),
      type: journalTypeValidator,
      mood: v.optional(moodValidator),
      tags: v.optional(v.array(v.string())),
      isEncrypted: v.boolean(),
      wordCount: v.number(),
      sentiment: v.optional(v.object({
        score: v.number(), // -1 to 1
        confidence: v.number(),
        emotions: v.optional(v.array(v.string()))
      })),
      researchConsent: v.optional(v.boolean()) // for research journals
    }).index("by_user", ["userId"])
      .index("by_user_and_type", ["userId", "type"])
      .index("by_research_consent", ["researchConsent"]),

    // Mindful Grove (gamification)
    groves: defineTable({
      userId: v.id("users"),
      level: v.number(),
      experience: v.number(),
      plantsUnlocked: v.array(v.string()),
      currentPlants: v.array(v.object({
        id: v.string(),
        type: v.string(),
        growthStage: v.number(), // 1-5
        lastWatered: v.optional(v.number()),
        health: v.number() // 1-100
      })),
      achievements: v.array(v.object({
        id: v.string(),
        unlockedAt: v.number(),
        type: v.string()
      }))
    }).index("by_user", ["userId"]),

    // Knowledge hub content
    knowledgeCards: defineTable({
      title: v.string(),
      content: v.string(),
      category: v.string(), // "mindfulness", "stress", "academic", "wellness"
      difficulty: v.string(), // "beginner", "intermediate", "advanced"
      estimatedReadTime: v.number(), // in minutes
      tags: v.array(v.string()),
      unlockRequirements: v.optional(v.object({
        activitiesCompleted: v.optional(v.number()),
        groveLevel: v.optional(v.number()),
        journalEntries: v.optional(v.number())
      })),
      culturalRelevance: v.optional(v.array(v.string())), // cultural backgrounds
      isPublic: v.boolean(),
      authorId: v.optional(v.id("users")),
      likes: v.optional(v.number()),
      views: v.optional(v.number())
    }).index("by_category", ["category"])
      .index("by_public", ["isPublic"])
      .index("by_cultural_relevance", ["culturalRelevance"]),

    // User progress on knowledge cards
    userKnowledgeProgress: defineTable({
      userId: v.id("users"),
      cardId: v.id("knowledgeCards"),
      unlocked: v.boolean(),
      completed: v.boolean(),
      rating: v.optional(v.number()), // 1-5 stars
      notes: v.optional(v.string())
    }).index("by_user", ["userId"])
      .index("by_user_and_card", ["userId", "cardId"]),

    // Kai's conversational memory
    conversations: defineTable({
      userId: v.id("users"),
      sessionId: v.string(),
      messages: v.array(v.object({
        role: v.string(), // "user" or "kai"
        content: v.string(),
        timestamp: v.number(),
        emotion: v.optional(v.string()),
        context: v.optional(v.object({
          currentMood: v.optional(v.string()),
          recentActivity: v.optional(v.string()),
          stressLevel: v.optional(v.number())
        }))
      })),
      summary: v.optional(v.string()),
      keyInsights: v.optional(v.array(v.string())),
      followUpReminders: v.optional(v.array(v.object({
        message: v.string(),
        scheduledFor: v.number()
      })))
    }).index("by_user", ["userId"])
      .index("by_session", ["sessionId"]),

    // Stress detection patterns
    stressPatterns: defineTable({
      userId: v.id("users"),
      patternType: v.string(), // "time_based", "activity_based", "environmental"
      triggers: v.array(v.string()),
      indicators: v.array(v.string()),
      severity: v.number(), // 1-10
      frequency: v.string(), // "daily", "weekly", "monthly"
      recommendations: v.array(v.string()),
      lastDetected: v.number(),
      isActive: v.boolean()
    }).index("by_user", ["userId"])
      .index("by_user_and_active", ["userId", "isActive"]),

    // Music and audioscape preferences
    audioPreferences: defineTable({
      userId: v.id("users"),
      preferredGenres: v.array(v.string()),
      culturalMusic: v.optional(v.array(v.string())),
      volumePreference: v.number(), // 0-100
      adaptiveSettings: v.object({
        adjustForMood: v.boolean(),
        adjustForTime: v.boolean(),
        adjustForActivity: v.boolean()
      }),
      customPlaylists: v.optional(v.array(v.object({
        name: v.string(),
        tracks: v.array(v.string()),
        mood: v.optional(v.string())
      })))
    }).index("by_user", ["userId"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;