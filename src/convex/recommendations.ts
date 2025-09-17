import { query } from "./_generated/server";
import { v } from "convex/values";

type Rec = {
  title: string;
  description: string;
  duration: number;
  type: "breathing" | "meditation" | "journaling" | "mindfulness" | "music" | "reflection" | "grounding" | "motivational";
};

const NEGATIVE_KEYWORDS: Array<string> = [
  "stress", "stressed", "anxious", "anxiety", "overwhelm", "overwhelmed",
  "burnout", "burned out", "tired", "exhausted", "panic", "worried",
  "pressure", "fear", "nervous", "sad", "low", "down",
];

const POSITIVE_KEYWORDS: Array<string> = [
  "grateful", "gratitude", "calm", "focus", "focused", "happy", "good", "win", "progress", "energy", "motivated",
];

function scoreText(text: string): { stress: number; positivity: number } {
  const t = text.toLowerCase();
  let stress = 0;
  for (const k of NEGATIVE_KEYWORDS) {
    if (t.includes(k)) stress += 1;
  }
  let positivity = 0;
  for (const k of POSITIVE_KEYWORDS) {
    if (t.includes(k)) positivity += 1;
  }
  return { stress, positivity };
}

export const getPersonalized = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Not signed in, return gentle general suggestions
      const generic: Array<Rec> = [
        {
          title: "60s Box Breathing",
          description: "A short-paced breath to reset tension: inhale 4, hold 4, exhale 4, hold 4 — repeat for 60s.",
          duration: 1,
          type: "breathing",
        },
        {
          title: "3-2-1 Pre‑Study Calm",
          description: "3 deep breaths, 2 minutes of mindful pause, 1 intention for your next task.",
          duration: 3,
          type: "mindfulness",
        },
        {
          title: "Gratitude Trio",
          description: "List 3 small things you appreciated today to nudge your mood upward.",
          duration: 2,
          type: "journaling",
        },
      ];
      return generic;
    }

    // Attempt to find the user by email (index exists on email)
    const email = identity.email ?? null;
    if (!email) {
      // Fallback when no email is present (anonymous). Return general suggestions.
      return [
        {
          title: "Grounding: 5‑4‑3‑2‑1",
          description: "Use your senses to anchor in the present: 5 see, 4 feel, 3 hear, 2 smell, 1 taste.",
          duration: 3,
          type: "grounding",
        },
        {
          title: "Gentle Focus Music",
          description: "A short calming soundscape to ease into steady attention.",
          duration: 2,
          type: "music",
        },
        {
          title: "Positive Reframe",
          description: "Write one current worry—then reframe it into a kinder, more helpful perspective.",
          duration: 3,
          type: "reflection",
        },
      ] as Array<Rec>;
    }

    const user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).unique();

    if (!user) {
      return [
        {
          title: "60s Breathing",
          description: "A minute of paced breathing lowers stress and calms the nervous system.",
          duration: 1,
          type: "breathing",
        },
        {
          title: "Micro‑Meditation",
          description: "Close your eyes, follow your breath for 2 minutes. Reset before your next step.",
          duration: 2,
          type: "meditation",
        },
        {
          title: "Gratitude Trio",
          description: "Note 3 small wins or comforts. Small positives compound into momentum.",
          duration: 2,
          type: "journaling",
        },
      ] as Array<Rec>;
    }

    const userId = user._id;

    // Pull recent journals (last ~20), conversations (last ~30), and recent moods
    const journalsIter = ctx.db.query("journals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc");
    const journals: Array<{ content: string; title: string }> = [];
    for await (const j of journalsIter) {
      journals.push({ content: j.content, title: j.title });
      if (journals.length >= 20) break;
    }

    const convIter = ctx.db.query("conversations").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc");
    const convMsgs: Array<string> = [];
    for await (const c of convIter) {
      for (const m of c.messages.slice(-10)) {
        convMsgs.push(m.content);
      }
      if (convMsgs.length >= 300) break; // roughly cap
    }

    const moodsIter = ctx.db.query("moods").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc");
    let moodCount = 0;
    let moodSum = 0;
    for await (const m of moodsIter) {
      // Map mood string to 1..5 for rough scoring
      const map: Record<string, number> = {
        very_low: 1,
        low: 2,
        neutral: 3,
        good: 4,
        excellent: 5,
      };
      const val = map[m.mood] ?? 3;
      moodSum += val;
      moodCount += 1;
      if (moodCount >= 30) break;
    }
    const avgMood = moodCount > 0 ? moodSum / moodCount : 3;

    // Aggregate text and score
    let stressScore = 0;
    let positivityScore = 0;

    for (const j of journals) {
      const s = scoreText(`${j.title} ${j.content}`);
      stressScore += s.stress;
      positivityScore += s.positivity;
    }
    for (const msg of convMsgs) {
      const s = scoreText(msg);
      stressScore += s.stress;
      positivityScore += s.positivity;
    }

    // Normalize rough indicators
    const highStress = stressScore >= 6 || avgMood <= 2.2;
    const mediumStress = (!highStress && (stressScore >= 3 || avgMood < 3.2));
    const lowStress = !highStress && !mediumStress;

    const recs: Array<Rec> = [];

    if (highStress) {
      recs.push(
        {
          title: "Grounding: 5‑4‑3‑2‑1",
          description: "Anchor in the present using senses: 5 see, 4 feel, 3 hear, 2 smell, 1 taste. Quick reset under pressure.",
          duration: 3,
          type: "grounding",
        },
        {
          title: "Box Breathing 60s",
          description: "Inhale 4, hold 4, exhale 4, hold 4. 4 cycles to downshift your nervous system.",
          duration: 1,
          type: "breathing",
        },
        {
          title: "Micro‑Meditation (2 min)",
          description: "Close eyes, follow the breath gently. When distracted, kindly return attention.",
          duration: 2,
          type: "meditation",
        },
      );
    } else if (mediumStress) {
      recs.push(
        {
          title: "Positive Reframe",
          description: "Write one worry, then reframe it kindly. Focus on a tiny, doable next step.",
          duration: 3,
          type: "reflection",
        },
        {
          title: "3‑2‑1 Study Starter",
          description: "3 breaths, 2 minutes mindful pause, 1 intention. Start lighter and steadier.",
          duration: 3,
          type: "mindfulness",
        },
        {
          title: "Gentle Focus Music",
          description: "Low‑stimulus soundscape to ease into a calm, productive state.",
          duration: 3,
          type: "music",
        },
      );
    } else if (lowStress) {
      recs.push(
        {
          title: "Gratitude Trio",
          description: "Note three small wins or comforts today. Builds momentum and resilience.",
          duration: 2,
          type: "journaling",
        },
        {
          title: "Single‑Task Sprint (15m)",
          description: "Pick one small, finishable task. Short, focused burst to keep your rhythm.",
          duration: 15,
          type: "mindfulness",
        },
        {
          title: "Breathing Pause (60s)",
          description: "One minute of paced breathing to maintain your steady state.",
          duration: 1,
          type: "breathing",
        },
      );
    }

    // Motivational nudge based on positivity
    if (positivityScore < 2) {
      recs.push({
        title: "Motivational Nudge",
        description: "A gentle reminder: progress beats perfection. One tiny step is enough right now.",
        duration: 1,
        type: "motivational",
      });
    }

    // Ensure at least 3 recs
    while (recs.length < 3) {
      recs.push({
        title: "Calm Reset (2 min)",
        description: "Sit comfortably, shoulders soft, follow the breath in and out. Let thoughts pass.",
        duration: 2,
        type: "meditation",
      });
    }

    // Cap to 6 to keep UI tight
    return recs.slice(0, 6);
  },
});
