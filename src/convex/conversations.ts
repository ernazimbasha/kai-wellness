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

    // Simple response generation based on keywords and context
    let response = "";
    let emotion = "supportive";
    
    const message = args.userMessage.toLowerCase();
    
    if (message.includes("stress") || message.includes("anxious") || message.includes("overwhelmed")) {
      response = "I can sense you're feeling stressed right now. That's completely normal for students! 🌱 Would you like to try a quick breathing exercise together? I can guide you through a 5-minute session that many students find really helpful.";
      emotion = "empathetic";
    } else if (message.includes("exam") || message.includes("test") || message.includes("study")) {
      response = "Exams can definitely be challenging! 📚 Remember, it's not just about studying hard, but also taking care of your mental wellbeing. Have you taken any breaks today? I could suggest some quick mindfulness exercises to help you focus better.";
      emotion = "encouraging";
    } else if (message.includes("tired") || message.includes("exhausted") || message.includes("sleep")) {
      response = "It sounds like you might need some rest. 😴 Good sleep is crucial for both your academic performance and emotional wellbeing. Would you like some tips for better sleep hygiene, or shall we try a relaxing meditation to help you unwind?";
      emotion = "caring";
    } else if (message.includes("good") || message.includes("great") || message.includes("happy")) {
      response = "That's wonderful to hear! 😊 I'm so glad you're feeling good. This is a perfect time to maybe try journaling about what's going well, or perhaps nurture your plants in the Mindful Grove. Positive moments are worth celebrating!";
      emotion = "joyful";
    } else {
      response = "Thank you for sharing that with me. I'm here to listen and support you. 💙 Is there anything specific you'd like to work on today? I can help with breathing exercises, meditation, journaling, or just be here to chat about what's on your mind.";
      emotion = "supportive";
    }

    // Add the response to the conversation
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