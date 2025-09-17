import { query } from "./_generated/server";
import { v } from "convex/values";

type Rec = {
  title: string;
  description: string;
  duration: number;
  type: "breathing" | "meditation" | "journaling" | "mindfulness" | "music" | "reflection" | "grounding" | "motivational" | "film" | "walk" | "game";
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

function shuffle<T>(arr: Array<T>): Array<T> {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueByTitle(items: Array<Rec>): Array<Rec> {
  const seen: Record<string, boolean> = {};
  const out: Array<Rec> = [];
  for (const r of items) {
    if (!seen[r.title]) {
      seen[r.title] = true;
      out.push(r);
    }
  }
  return out;
}

export const getPersonalized = query({
  args: { userText: v.optional(v.string()) },
  handler: async (ctx, args) => {
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

    const user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", identity.email ?? "")).unique();

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

    // Incorporate live user input first (weighted slightly higher on stress)
    if (args.userText && args.userText.trim().length > 0) {
      const s = scoreText(args.userText);
      stressScore += s.stress * 2;
      positivityScore += s.positivity;
    }

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

    // Add: intent parsing for richer, user-directed suggestions
    const text = (args.userText ?? "").toLowerCase();
    const wantsFilm = /(movie|film|watch|series|anime)/.test(text);
    const wantsMusic = /(music|song|listen|playlist|lofi|lo\-?fi)/.test(text);
    const wantsWalk = /(walk|outside|fresh air|sunlight|stroll|stretch)/.test(text);
    const wantsGame = /(game|play|mini\-?game|fun)/.test(text);

    const topicExam = /(exam|test|study|assignment|deadline)/.test(text);
    const topicSleep = /(sleep|insomnia|bed|night|rest)/.test(text);
    const topicFocus = /(focus|concentrat|distract|procrastinat)/.test(text);
    const topicLonely = /(alone|lonely|isolat|no one)/.test(text);
    const topicBurnout = /(burnout|burned out|exhaust|tired|drained)/.test(text);

    const intentRecs: Array<Rec> = [];

    if (wantsFilm) {
      intentRecs.push(
        {
          title: "Feel‑Good Film Break",
          description: "Pick a gentle, uplifting movie (e.g., Paddington 2, Soul, The Secret Life of Walter Mitty). Set a 90‑120m window max.",
          duration: 100,
          type: "film",
        },
        {
          title: "Short Series Reset",
          description: "Watch one light episode (20–30m) then return—keeps it restorative, not avoidant.",
          duration: 25,
          type: "film",
        }
      );
    }

    if (wantsMusic || topicFocus) {
      intentRecs.push(
        {
          title: "Lofi Focus Mix (15m)",
          description: "Low‑stimulus playlist to settle attention. Headphones, moderate volume, one small task.",
          duration: 15,
          type: "music",
        },
        {
          title: "Mood Uplift Tracks (5–10m)",
          description: "Play 2–3 upbeat songs you associate with small wins to nudge momentum.",
          duration: 8,
          type: "music",
        }
      );
    }

    if (wantsWalk || topicBurnout) {
      intentRecs.push(
        {
          title: "Sunlight Walk (10m)",
          description: "Go outside for fresh air and gentle sunlight. Look far, relax shoulders, breathe slowly.",
          duration: 10,
          type: "walk",
        },
        {
          title: "Stretch & Sip (5m)",
          description: "Light stretches + hydration break. Calm the body before the next step.",
          duration: 5,
          type: "walk",
        }
      );
    }

    if (wantsGame) {
      intentRecs.push(
        {
          title: "Quick Breathing Game (60s)",
          description: "Follow a paced inhale/exhale rhythm like a mini game—aim for 4 calm cycles.",
          duration: 1,
          type: "game",
        },
        {
          title: "5‑4‑3‑2‑1 Senses Challenge",
          description: "Name 5 see, 4 feel, 3 hear, 2 smell, 1 taste—turn grounding into a quick win.",
          duration: 3,
          type: "game",
        }
      );
    }

    if (topicExam) {
      intentRecs.push(
        {
          title: "3‑2‑1 Study Starter",
          description: "3 breaths, 2 minutes mindful pause, 1 clear intention—start lighter and steadier.",
          duration: 3,
          type: "mindfulness",
        }
      );
    }

    if (topicSleep) {
      intentRecs.push(
        {
          title: "Sleep Wind‑Down (10m)",
          description: "Dim lights, stretch 2m, hydrate, jot 3‑item plan for tomorrow—signal your brain it's bedtime.",
          duration: 10,
          type: "mindfulness",
        }
      );
    }

    if (topicLonely) {
      intentRecs.push(
        {
          title: "Micro‑Connection (3m)",
          description: "Send a supportive note or thank someone specifically—small social dose reduces stress.",
          duration: 3,
          type: "reflection",
        }
      );
    }

    // Motivational nudge based on positivity
    if (positivityScore < 2) {
      recs.push({
        title: "Motivational Nudge",
        description: "Progress > perfection. One tiny, kind step is enough right now.",
        duration: 1,
        type: "motivational",
      });
    }

    // Blend intent-based and stress-based, dedupe, shuffle, ensure variety and count
    let combined = uniqueByTitle([...intentRecs, ...recs]);

    // Fallbacks if still light
    const fallbacks: Array<Rec> = [
      {
        title: "Calm Reset (2 min)",
        description: "Sit comfortably, soften shoulders, follow the breath. Let thoughts pass.",
        duration: 2,
        type: "meditation",
      },
      {
        title: "Gratitude Trio",
        description: "Note 3 small wins or comforts today to gently lift mood.",
        duration: 2,
        type: "journaling",
      },
      {
        title: "Breathing Pause (60s)",
        description: "Inhale 4, hold 4, exhale 6—repeat to downshift tension quickly.",
        duration: 1,
        type: "breathing",
      },
    ];

    for (const f of fallbacks) {
      if (combined.length >= 6) break;
      if (!combined.find((r) => r.title === f.title)) combined.push(f);
    }

    // Shuffle for variety and cap
    combined = shuffle(combined).slice(0, 6);
    return combined;
  },
});