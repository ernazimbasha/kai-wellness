import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getCurrentUser } from "./users";

// Start new conversation session
export const startConversation = mutation({
  args: {
    initialMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const messages = [];
    
    // Add Kai's greeting
    messages.push({
      role: "kai",
      content: `Hi ${user.name || 'there'}! 👋 I'm Kai, your AI wellness companion. I'm here to support you through your student journey. How are you feeling today?`,
      timestamp: Date.now(),
      emotion: "friendly"
    });

    // Add user's initial message if provided
    if (args.initialMessage) {
      messages.push({
        role: "user",
        content: args.initialMessage,
        timestamp: Date.now()
      });
    }

    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      sessionId,
      messages,
      summary: "New conversation started",
      keyInsights: [],
      followUpReminders: []
    });

    // Return both for the client to use
    return { sessionId, conversationId };
  },
});

// Add message to conversation
export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    message: v.string(),
    role: v.string(),
    emotion: v.optional(v.string()),
    context: v.optional(v.object({
      currentMood: v.optional(v.string()),
      recentActivity: v.optional(v.string()),
      stressLevel: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const newMessage = {
      role: args.role,
      content: args.message,
      timestamp: Date.now(),
      emotion: args.emotion,
      context: args.context
    };

    await ctx.db.patch(conversation._id, {
      messages: [...conversation.messages, newMessage]
    });

    return newMessage;
  },
});

// Get conversation history
export const getConversation = query({
  args: {
    sessionId: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

// Get user's recent conversations
export const getUserConversations = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Generate Kai's response (simplified AI response)
export const generateKaiResponse = mutation({
  args: {
    sessionId: v.string(),
    userMessage: v.string(),
    userContext: v.optional(v.object({
      currentMood: v.optional(v.string()),
      recentActivity: v.optional(v.string()),
      stressLevel: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Simple response generation strictly focused on wellbeing and stress support
    let response = "";
    let emotion = "supportive";
    
    const message = args.userMessage.toLowerCase();

    if (message.includes("stress") || message.includes("anxious") || message.includes("overwhelmed")) {
      response = "I hear you—feeling stressed can be heavy. Let's take a micro-step together. Try a quick 4-4-6 breath: inhale 4, hold 4, exhale 6. I'm here with you. Would you like a short guided breathing or a calming reflection prompt?";
      emotion = "empathetic";
    } else if (message.includes("exam") || message.includes("test") || message.includes("study")) {
      response = "Exams can bring pressure. You're not alone. A brief reset can boost focus—how about a 60-second breathing round or a grounding check-in? I can also share a gentle study break routine to ease your mind.";
      emotion = "encouraging";
    } else if (message.includes("tired") || message.includes("exhausted") || message.includes("sleep")) {
      response = "Your body's asking for care. Let's invite calm: dim lights, slower breathing (in 4 • hold 4 • out 6). I can guide a 2-minute wind-down or share a simple sleep hygiene tip if you'd like.";
      emotion = "caring";
    } else if (message.includes("good") || message.includes("great") || message.includes("happy")) {
      response = "That's wonderful—let's nourish that feeling. A brief gratitude note or a mindful minute can help it last. Want a quick prompt to capture what's going well today?";
      emotion = "joyful";
    } else {
      // Always steer to stress relief and emotional support
      response = "Thank you for opening up. I'm here to help you feel calmer and supported. Would you prefer a guided breathing minute, a grounding exercise (5-4-3-2-1), or a gentle reflection to untangle what's on your mind?";
      emotion = "supportive";
    }

    await ctx.runMutation(api.conversations.addMessage, {
      sessionId: args.sessionId,
      message: response,
      role: "kai",
      emotion,
      context: args.userContext
    });

    return { response, emotion };
  },
});