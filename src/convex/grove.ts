import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Initialize user's grove
export const initializeGrove = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if grove already exists
    const existingGrove = await ctx.db
      .query("groves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingGrove) {
      return existingGrove._id;
    }

    // Create new grove with starter plant
    return await ctx.db.insert("groves", {
      userId: user._id,
      level: 1,
      experience: 0,
      plantsUnlocked: ["seedling", "sprout"],
      currentPlants: [{
        id: "starter-plant",
        type: "seedling",
        growthStage: 1,
        lastWatered: Date.now(),
        health: 100
      }],
      achievements: []
    });
  },
});

// Get user's grove
export const getUserGrove = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const grove = await ctx.db
      .query("groves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return grove;
  },
});

// Water plants (complete activity)
export const waterPlants = mutation({
  args: {
    activityType: v.string(),
    duration: v.number()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const grove = await ctx.db
      .query("groves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!grove) {
      throw new Error("Grove not found");
    }

    // Calculate experience gained based on activity
    const experienceGained = Math.floor(args.duration * 2); // 2 XP per minute
    const newExperience = grove.experience + experienceGained;
    
    // Check for level up (every 100 XP)
    const newLevel = Math.floor(newExperience / 100) + 1;
    const leveledUp = newLevel > grove.level;

    // Update plant health and growth
    const updatedPlants = grove.currentPlants.map(plant => {
      const newHealth = Math.min(plant.health + 10, 100);
      let newGrowthStage = plant.growthStage;
      
      // Grow plant if well cared for
      if (newHealth >= 80 && Math.random() > 0.7) {
        newGrowthStage = Math.min(plant.growthStage + 1, 5);
      }

      return {
        ...plant,
        health: newHealth,
        growthStage: newGrowthStage,
        lastWatered: Date.now()
      };
    });

    // Unlock new plants on level up
    let newPlantsUnlocked = grove.plantsUnlocked;
    if (leveledUp) {
      const availablePlants = ["flower", "tree", "cactus", "fern", "bamboo"];
      const unlockedPlant = availablePlants.find(p => !grove.plantsUnlocked.includes(p));
      if (unlockedPlant) {
        newPlantsUnlocked = [...grove.plantsUnlocked, unlockedPlant];
      }
    }

    await ctx.db.patch(grove._id, {
      level: newLevel,
      experience: newExperience,
      plantsUnlocked: newPlantsUnlocked,
      currentPlants: updatedPlants
    });

    return {
      experienceGained,
      leveledUp,
      newLevel,
      plantsGrown: updatedPlants.filter((p, i) => p.growthStage > grove.currentPlants[i].growthStage).length
    };
  },
});

// Plant new seed
export const plantSeed = mutation({
  args: {
    plantType: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const grove = await ctx.db
      .query("groves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!grove) {
      throw new Error("Grove not found");
    }

    // Check if plant type is unlocked
    if (!grove.plantsUnlocked.includes(args.plantType)) {
      throw new Error("Plant type not unlocked");
    }

    // Add new plant
    const newPlant = {
      id: `plant-${Date.now()}`,
      type: args.plantType,
      growthStage: 1,
      lastWatered: Date.now(),
      health: 100
    };

    await ctx.db.patch(grove._id, {
      currentPlants: [...grove.currentPlants, newPlant]
    });

    return newPlant;
  },
});

// Get grove leaderboard
export const getGroveLeaderboard = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const groves = await ctx.db
      .query("groves")
      .order("desc")
      .take(args.limit || 10);

    // Get user names for leaderboard
    const leaderboard = [];
    for (const grove of groves) {
      const user = await ctx.db.get(grove.userId);
      if (user) {
        leaderboard.push({
          name: user.name || "Anonymous",
          level: grove.level,
          experience: grove.experience,
          plantsCount: grove.currentPlants.length
        });
      }
    }

    return leaderboard.sort((a, b) => b.level - a.level || b.experience - a.experience);
  },
});
