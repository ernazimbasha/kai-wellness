import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Heart, 
  Leaf, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Target,
  Sparkles,
  MessageCircle,
  Activity,
  Award,
  Smile,
  Mic
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useState, useRef, type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Add: controlled tabs state
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "grove" | "insights">("overview");
  // Add: ref to scroll to Journals & Knowledge Hub section
  const journalsRef = useRef<HTMLDivElement | null>(null);

  // Add: local UI state for journals reader and games
  const [selectedJournal, setSelectedJournal] = useState<{ title: string; content: string; description: string; bullets?: Array<string> } | null>(null);
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathSeconds, setBreathSeconds] = useState<number>(0);
  const [groundingStep, setGroundingStep] = useState<number>(0);

  // Add: interactive responses state for games
  const [reflectionAnswer, setReflectionAnswer] = useState<string>("");
  const [moodSelection, setMoodSelection] = useState<string | null>(null);
  const [worryInput, setWorryInput] = useState<string>("");
  const [reframe, setReframe] = useState<string>("");
  const [gratitude1, setGratitude1] = useState<string>("");
  const [gratitude2, setGratitude2] = useState<string>("");
  const [gratitude3, setGratitude3] = useState<string>("");

  // Add: varied prompt sets for Gratitude Trio and state to rotate them
  const gratitudePromptSets: Array<{ one: string; two: string; three: string }> = [
    {
      one: "1) Something simple that felt good...",
      two: "2) A person or moment you appreciated...",
      three: "3) One tiny win you noticed...",
    },
    {
      one: "1) A comfort from today (taste, sound, or sight)...",
      two: "2) Someone who made life a bit easier...",
      three: "3) One thing you did despite resistance...",
    },
    {
      one: "1) A small act of kindness you saw or did...",
      two: "2) A place where you felt calm today...",
      three: "3) A helpful thought you had...",
    },
    {
      one: "1) A study tool or habit that helped...",
      two: "2) A supportive message or check‑in...",
      three: "3) One step you took toward a goal...",
    },
  ];
  const [gratitudeSetIndex, setGratitudeSetIndex] = useState<number>(0);

  // Add: answers for each 5‑4‑3‑2‑1 grounding step
  const [groundingAnswers, setGroundingAnswers] = useState<Array<string>>([
    "", "", "", "", ""
  ]);

  // Richer content for journal reading
  const journalArticles: Array<{ title: string; content: string; description: string; bullets?: Array<string> }> = [
    {
      title: "Daily Reflection: Small Wins",
      description: "Capture small achievements to build momentum and self-efficacy.",
      bullets: [
        "Why it works: reinforces progress focus over perfection",
        "Try: write 1 tiny win and what enabled it",
        "Keep it under 2 minutes; consistency > length",
      ],
      content:
        "Take 3–5 minutes to note one small win from today—finishing a reading, attending class on time, helping a friend. Why it matters: small wins train your brain to notice progress, reduce stress by restoring a sense of control, and build a positive feedback loop for tomorrow's actions.",
    },
    {
      title: "Beat Exam Stress: 3-2-1",
      description: "A simple pre‑study routine to calm your mind and start focused.",
      bullets: [
        "3 deep breaths (inhale 4s, exhale 6s)",
        "2 minutes of mindful pause",
        "1 clear intention before you start",
      ],
      content:
        "Try the 3-2-1 method before studying: 3 deep breaths (inhale 4s, exhale 6s), 2 minutes of mindful pause (notice sounds, posture, breath), 1 clear intention for the session. Repeat this micro‑routine between blocks to keep stress low and concentration high.",
    },
    {
      title: "Sleep Reset: Gentle Routine",
      description: "Consistent, low‑effort habits to signal your brain it's bedtime.",
      bullets: [
        "Dim lights, stretch 2 minutes, hydrate",
        "Write a 3‑item plan for tomorrow",
        "Avoid screens in the last 20 minutes",
      ],
      content:
        "Set a consistent wind‑down routine 30 minutes before bed: dim lights, avoid screens, sip water, stretch for 2 minutes, and write a 3‑item plan for tomorrow. Over a week, you'll notice calmer nights and smoother mornings as your brain learns the wind‑down cue.",
    },
    {
      title: "Study Energy: 50/10 Method",
      description: "Sustain energy with focused sprints and mindful breaks.",
      bullets: [
        "50 mins deep focus, 10 mins recovery",
        "Breaks reduce cognitive load",
        "After 3 cycles, take a longer reset",
      ],
      content:
        "Work for 50 minutes with deep focus, then take a 10‑minute recovery: stand, breathe, or take a short walk. Use the break to lower cognitive load, not to fill it. After 3 cycles, take a longer 30‑minute reset. This protects attention and reduces burnout.",
    },
    {
      title: "Social Recharge: Micro‑Connection",
      description: "Quick social doses that reduce stress and lift mood.",
      bullets: [
        "Send one supportive note",
        "Share a helpful resource",
        "Thank a peer for something specific",
      ],
      content:
        "Send one supportive message, share a helpful resource, or thank a peer. Micro‑connections reduce cortisol and increase resilience. Track how your mood shifts after a 2‑minute connection.",
    },
    {
      title: "Focus Builder: Single‑Task Blocks",
      description: "Cut overwhelm by isolating one clear, finishable task.",
      bullets: [
        "Choose a 15–25 min task",
        "Silence notifications, close tabs",
        "Celebrate the finish, then pick the next",
      ],
      content:
        "Pick one tiny task you can finish in 15–25 minutes. Close extra tabs, silence notifications, and set a visible timer. When done, celebrate the finish—then choose the next small block. Finishing trains focus and builds steady momentum.",
    },
    {
      title: "Anxiety First Aid: Name & Normalize",
      description: "Label feelings to reduce intensity and reclaim control.",
      bullets: [
        "Say: \"This is anxiety, not danger\"",
        "Try 4‑4‑6 breathing for a minute",
        "Write one next action you control",
      ],
      content:
        "When anxious, pause and name it: \"This is anxiety, not danger.\" Remind yourself it rises and falls like a wave. Try 4‑4‑6 breathing for a minute, then write one next action you can control. Naming + action helps reduce spiraling.",
    },
    {
      title: "Peer Power: Study Buddy System",
      description: "Reduce procrastination with low‑pressure accountability.",
      bullets: [
        "Quick 5‑min check‑ins or silent co‑working",
        "Share one intention per session",
        "Confirm when done; keep it light",
      ],
      content:
        "Find a buddy for silent co‑working or quick 5‑minute check‑ins. Share your one intention for the session and confirm when done. Keep it light. Accountability improves follow‑through and reduces isolation.",
    },
    {
      title: "Mindful Mornings: 5‑Minute Start",
      description: "A short routine that steadies attention for the day.",
      bullets: [
        "30s breath, 60s stretch, 2 mins plan",
        "One priority, one helper habit",
        "Light hydration before screens",
      ],
      content:
        "Begin with a 5‑minute mini‑routine: 30 seconds of slow breathing, a 60‑second stretch, and 2 minutes to choose your top priority and a tiny helper habit (e.g., water before coffee). This primes your day for steadier attention.",
    },
    {
      title: "Break the Overwhelm Spiral",
      description: "Practical steps to regain momentum when stuck.",
      bullets: [
        "Write the smallest next step",
        "Set a 10‑minute timer",
        "Start messy, refine later",
      ],
      content:
        "When everything feels like 'too much,' write down only the smallest next step and start a 10‑minute timer. Give yourself permission to start messy. Momentum beats perfection—stack the next tiny step after the timer.",
    },
    {
      title: "Quick Mood Reset: Box Breathing",
      description: "A fast calm‑down technique you can do anywhere.",
      bullets: [
        "Inhale 4, hold 4, exhale 4, hold 4",
        "Repeat 4 cycles",
        "Use before calls, tests, or tough tasks",
      ],
      content:
        "Box breathing helps you reset: inhale for 4, hold for 4, exhale for 4, hold for 4—repeat 4 cycles. Use it before calls, tests, or when you notice tension rising. Short, structured breathing calms your nervous system.",
    },
  ];

  const randomQuestions: Array<string> = [
    "What's one thing you're grateful for today—and why?",
    "If stress was a color right now, what color would it be?",
    "What would '1% better' look like for you tomorrow?",
    "Which class drains your energy the most—and what's one tiny fix?",
    "What made you smile recently?",
  ];

  const groundingSteps: Array<string> = [
    "Name 5 things you can see.",
    "Name 4 things you can feel.",
    "Name 3 things you can hear.",
    "Name 2 things you can smell.",
    "Name 1 thing you can taste.",
  ];

  const startBreathing = () => {
    if (isBreathing) return;
    setIsBreathing(true);
    setBreathSeconds(60);
    const id = setInterval(() => {
      setBreathSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          setIsBreathing(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // Fetch dashboard data
  const moodTrends = useQuery(api.moods.getMoodTrends, { days: 30 });
  const activityStats = useQuery(api.activities.getActivityStats, { days: 30 });
  const journalStats = useQuery(api.journals.getJournalStats);
  const userGrove = useQuery(api.grove.getUserGrove);
  const recommendations = useQuery(api.activities.getActivityRecommendations);

  // Mutations
  const initializeGrove = useMutation(api.grove.initializeGrove);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Initialize grove if it doesn't exist
  if (userGrove === null) {
    initializeGrove();
  }

  const handleStartActivity = (type: string) => {
    setActiveTab("activities");
    toast.success(`Starting ${type} activity`);
  };

  const handleOpenChat = () => {
    navigate("/chat");
  };

  // Add: handler for voice-focused chat (simple redirect for now)
  const handleSpeakWithKai = () => {
    navigate("/chat");
    toast.message("Voice mode: enable mic in Chat to speak with Kai");
  };

  // Add: helper to go to Journals info
  const goToJournalsInfo = () => {
    setActiveTab("overview");
    // Smoothly scroll after tab renders
    setTimeout(() => {
      journalsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    toast.info("Opened Journals & Knowledge Hub");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Glassmorphism background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back, {user.name || "Student"}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                Let's check in on your wellness journey today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleOpenChat}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Kai
              </Button>
              <Button 
                onClick={handleSpeakWithKai}
                variant="outline"
                className="bg-white/30 backdrop-blur-md border-white/30 hover:bg-white/40"
              >
                <Mic className="mr-2 h-4 w-4" />
                Speak with Kai
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Streak Days</p>
                      <p className="text-2xl font-bold">{activityStats?.streakDays || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grove Level</p>
                      <p className="text-2xl font-bold">{userGrove?.level || 1}</p>
                    </div>
                    <Leaf className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Activities</p>
                      <p className="text-2xl font-bold">{activityStats?.completedActivities || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Mood</p>
                      <p className="text-2xl font-bold">{moodTrends?.averageMood?.toFixed(1) || "N/A"}</p>
                    </div>
                    <Smile className="h-8 w-8 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList className="bg-white/20 backdrop-blur-md border-white/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="grove">Mindful Grove</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Kai's Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized activities based on your recent patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations?.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rec.duration} minutes</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTab("activities");
                              toast.success(`Starting ${rec.type} activity`);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                          >
                            Start
                          </Button>
                        </div>
                      </motion.div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Complete some activities to get personalized recommendations!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mood Trends */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Mood Trends
                    </CardTitle>
                    <CardDescription>
                      Your emotional wellbeing over the past 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Mood</span>
                        <span className="text-2xl font-bold">
                          {moodTrends?.averageMood?.toFixed(1) || "N/A"}/5
                        </span>
                      </div>
                      <Progress 
                        value={(moodTrends?.averageMood || 0) * 20} 
                        className="h-2"
                      />
                      
                      {moodTrends?.moodDistribution && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Mood Distribution</h4>
                          {Object.entries(moodTrends.moodDistribution).map(([mood, count]) => (
                            <div key={mood} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{mood.replace('_', ' ')}</span>
                              <span>{count} times</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Journals & Mind Games side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2 items-stretch [grid-auto-rows:1fr] [&>*]:h-full">
                {/* Journals & Knowledge Hub info + reader */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  ref={journalsRef}
                  className="h-full"
                >
                  <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl h-full flex flex-col min-h-[560px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                        Journals & Knowledge Hub
                      </CardTitle>
                      <CardDescription>
                        Brief guidance, mini articles, and unlockable insights
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      {!selectedJournal ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="h-5 w-5 text-purple-500" />
                                <h4 className="font-medium">Students</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Private journals and daily motivational updates to build healthy study habits and resilience.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                <h4 className="font-medium">Researchers</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Access anonymized insights to study student wellness trends—privacy-first and consent-driven.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Leaf className="h-5 w-5 text-emerald-500" />
                                <h4 className="font-medium">Public Users</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Unlock knowledge cards and curated wellness content with simple guidance and tips for everyday wellbeing.
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Read a short guide</h4>
                            <div className="space-y-2">
                              {journalArticles.map((a) => (
                                <div
                                  key={a.title}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20"
                                >
                                  <div className="pr-3">
                                    <span className="font-medium block">{a.title}</span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {a.description}
                                    </p>
                                    {a.bullets && a.bullets.length > 0 && (
                                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-muted-foreground">
                                        {a.bullets.slice(0, 3).map((b) => (
                                          <li key={b}>{b}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                                    onClick={() => setSelectedJournal(a)}
                                  >
                                    Read
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              className="bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                              onClick={goToJournalsInfo}
                            >
                              Learn More
                            </Button>
                            <Button
                              onClick={() => {
                                setActiveTab("activities");
                                toast.success("Try a guided journaling activity");
                              }}
                              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                            >
                              Start Journaling
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">{selectedJournal.title}</h4>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedJournal(null)}
                              className="bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                            >
                              Back
                            </Button>
                          </div>
                          {/* Added richer article-like view */}
                          <div className="space-y-3">
                            {/* Show the short description as an intro */}
                            <p className="text-sm text-muted-foreground">{selectedJournal.description}</p>
                            {/* Key points if available */}
                            {"bullets" in selectedJournal && Array.isArray((selectedJournal as any).bullets) && (selectedJournal as any).bullets.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Key takeaways</h5>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                  {(selectedJournal as any).bullets.map((b: string) => (
                                    <li key={b}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="h-px bg-white/30" />
                            {/* Full content */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {selectedJournal.content}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Mind Relaxing Games */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="h-full"
                >
                  <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl h-full flex flex-col min-h-[560px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-pink-500" />
                        Mind Relaxing Games
                      </CardTitle>
                      <CardDescription>
                        Light interactions to reset focus and calm the mind
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      {/* Random Prompt with Response */}
                      <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Random Reflection</h4>
                          <Button
                            size="sm"
                            onClick={() => {
                              const q = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
                              setRandomPrompt(q);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                          >
                            New Question
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground min-h-10">
                          {randomPrompt || "Click 'New Question' to get a reflective prompt."}
                        </p>
                        <div className="space-y-2">
                          <Textarea
                            value={reflectionAnswer}
                            onChange={(e) => setReflectionAnswer(e.target.value)}
                            placeholder="Type your reflection here..."
                            className="min-h-20 bg-white/50 border-white/40"
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!reflectionAnswer.trim()) {
                                  toast.error("Write a quick reflection before submitting");
                                  return;
                                }
                                toast.success("Reflection saved. Great self‑check!");
                                setReflectionAnswer("");
                              }}
                              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0"
                            >
                              Submit
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 60s Breathing */}
                      <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">60s Breathing</h4>
                          {isBreathing ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsBreathing(false);
                                setBreathSeconds(0);
                              }}
                              className="bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                            >
                              Stop
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={startBreathing}
                              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0"
                            >
                              Start
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{isBreathing ? "Breathe with the rhythm..." : "Click Start to begin a 60s paced breath."}</span>
                          <span>{breathSeconds > 0 ? `${breathSeconds}s` : ""}</span>
                        </div>
                        <div className="h-2 w-full bg-white/30 rounded overflow-hidden">
                          <div
                            className="h-2 bg-emerald-500 transition-all"
                            style={{ width: `${(breathSeconds / 60) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Mood Check-in */}
                      <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Mood Check‑in</h4>
                          {moodSelection && (
                            <span className="text-xs text-muted-foreground">
                              Selected: {moodSelection}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-2xl">
                          {[
                            { label: "Very Low", emoji: "😞" },
                            { label: "Low", emoji: "🙁" },
                            { label: "Neutral", emoji: "😐" },
                            { label: "Good", emoji: "🙂" },
                            { label: "Great", emoji: "😄" },
                          ].map((m) => (
                            <button
                              key={m.label}
                              className={`p-3 rounded-lg bg-white/40 hover:bg-white/60 border border-white/30 transition ${
                                moodSelection === m.label ? "ring-2 ring-purple-400" : ""
                              }`}
                              onClick={() => {
                                setMoodSelection(m.label);
                                toast.message(`Noted: ${m.label}`, {
                                  description:
                                    m.label === "Very Low"
                                      ? "Be gentle with yourself—try a short breath or a short walk."
                                      : m.label === "Low"
                                      ? "Small reset helps—water break or 3 deep breaths."
                                      : m.label === "Neutral"
                                      ? "Steady pace. A tiny win will lift momentum."
                                      : m.label === "Good"
                                      ? "Nice! Keep your rhythm with a mindful break."
                                      : "Awesome! Share a small win with a friend.",
                                });
                              }}
                              aria-label={m.label}
                            >
                              {m.emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Positive Reframe */}
                      <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20 space-y-3">
                        <h4 className="font-medium">Positive Reframe</h4>
                        <p className="text-sm text-muted-foreground">
                          Write a worry—Kai suggests a kinder, more helpful way to see it.
                        </p>
                        <Textarea
                          value={worryInput}
                          onChange={(e) => setWorryInput(e.target.value)}
                          placeholder="e.g., I'm behind on readings and feel overwhelmed..."
                          className="min-h-20 bg-white/50 border-white/40"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              const w = worryInput.trim();
                              if (!w) {
                                toast.error("Type your worry to reframe it");
                                return;
                              }
                              const suggestion =
                                "A kinder view: Progress beats perfection. Pick one small, clear step you can do now. Then acknowledge that step as a win.";
                              setReframe(suggestion);
                              toast.success("Here's a gentle reframe");
                            }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                          >
                            Reframe
                          </Button>
                        </div>
                        {reframe && (
                          <div className="p-3 rounded-lg bg-white/40 border border-white/30 text-sm text-muted-foreground">
                            {reframe}
                          </div>
                        )}
                      </div>

                      {/* Gratitude Trio */}
                      <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/20 space-y-3">
                        <h4 className="font-medium">Gratitude Trio</h4>
                        <p className="text-sm text-muted-foreground">
                          Note three small things you're grateful for today.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            value={gratitude1}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGratitude1(e.target.value)}
                            placeholder={gratitudePromptSets[gratitudeSetIndex].one}
                            className="bg-white/50 border-white/40"
                          />
                          <Input
                            value={gratitude2}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGratitude2(e.target.value)}
                            placeholder={gratitudePromptSets[gratitudeSetIndex].two}
                            className="bg-white/50 border-white/40"
                          />
                          <Input
                            value={gratitude3}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGratitude3(e.target.value)}
                            placeholder={gratitudePromptSets[gratitudeSetIndex].three}
                            className="bg-white/50 border-white/40"
                          />
                        </div>
                        <div className="flex justify-between">
                          {/* New: Rotate prompts button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGratitudeSetIndex((i) => (i + 1) % gratitudePromptSets.length);
                              toast.message("New gratitude prompts loaded");
                            }}
                            className="bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                          >
                            New Prompts
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const vals = [gratitude1.trim(), gratitude2.trim(), gratitude3.trim()];
                              const count = vals.filter(Boolean).length;
                              if (count === 0) {
                                toast.error("Add at least one gratitude");
                                return;
                              }
                              toast.success(`Saved ${count} gratitude${count > 1 ? "s" : ""}. Well done!`);
                              setGratitude1("");
                              setGratitude2("");
                              setGratitude3("");
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Jump into activities to boost your wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={goToJournalsInfo}
                    >
                      <BookOpen className="h-6 w-6 mb-2 text-green-500" />
                      <span className="text-sm">Journal</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => {
                        setActiveTab("activities");
                        toast.info("Meditation is available in Activities");
                      }}
                    >
                      <Heart className="h-6 w-6 mb-2 text-purple-500" />
                      <span className="text-sm">Meditation</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => setActiveTab("insights")}
                    >
                      <TrendingUp className="h-6 w-6 mb-2 text-blue-500" />
                      <span className="text-sm">Insights</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => setActiveTab("grove")}
                    >
                      <Leaf className="h-6 w-6 mb-2 text-emerald-500" />
                      <span className="text-sm">Grove</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="activities">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle>Activity Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold">{activityStats?.completedActivities || 0}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold">{Math.round(activityStats?.averageDuration || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Minutes</div>
                    </div>
                  </div>
                  
                  {activityStats?.activityBreakdown && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Activity Breakdown</h4>
                      {Object.entries(activityStats.activityBreakdown).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle>Journal Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold">{journalStats?.totalEntries || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Entries</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold">{Math.round(journalStats?.averageWordsPerEntry || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Words</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                    <div className="text-2xl font-bold">{journalStats?.entriesThisWeek || 0}</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="grove">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-500" />
                    Your Mindful Grove
                  </CardTitle>
                  <CardDescription>
                    Watch your garden grow as you complete wellness activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userGrove ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                          <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                          <div className="text-2xl font-bold">Level {userGrove.level}</div>
                          <div className="text-sm text-muted-foreground">Grove Level</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <div className="text-2xl font-bold">{userGrove.experience}</div>
                          <div className="text-sm text-muted-foreground">Experience</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                          <Leaf className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="text-2xl font-bold">{userGrove.currentPlants.length}</div>
                          <div className="text-sm text-muted-foreground">Plants</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Your Plants</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {userGrove.currentPlants.map((plant, index) => (
                            <motion.div
                              key={plant.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-lg bg-white/30 backdrop-blur-sm text-center"
                            >
                              <div className="text-4xl mb-2">
                                {plant.type === "seedling" && "🌱"}
                                {plant.type === "sprout" && "🌿"}
                                {plant.type === "flower" && "🌸"}
                                {plant.type === "tree" && "🌳"}
                                {plant.type === "cactus" && "🌵"}
                              </div>
                              <div className="text-sm font-medium capitalize">{plant.type}</div>
                              <div className="text-xs text-muted-foreground">
                                Stage {plant.growthStage}/5
                              </div>
                              <Progress 
                                value={plant.health} 
                                className="h-1 mt-2"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={() => setActiveTab("grove")}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                      >
                        Visit Your Grove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Leaf className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                      <p className="text-muted-foreground mb-4">Your grove is being prepared...</p>
                      <Button onClick={() => initializeGrove()}>
                        Initialize Grove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="insights">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle>Wellness Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <h4 className="font-medium mb-2">🎯 Progress Highlights</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• You've maintained a {activityStats?.streakDays || 0}-day activity streak!</li>
                        <li>• Your average mood has been {moodTrends?.averageMood?.toFixed(1) || "N/A"}/5 this month</li>
                        <li>• You've completed {activityStats?.completedActivities || 0} wellness activities</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <h4 className="font-medium mb-2">💡 Recommendations</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Try morning meditation to start your day mindfully</li>
                        <li>• Journal regularly to track your emotional patterns</li>
                        <li>• Use breathing exercises during study breaks</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle>Upcoming Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Weekly Activity Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.min(activityStats?.completedActivities || 0, 7)}/7
                        </span>
                      </div>
                      <Progress value={Math.min((activityStats?.completedActivities || 0) / 7 * 100, 100)} />
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Grove Level Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {(userGrove?.experience || 0) % 100}/100 XP
                        </span>
                      </div>
                      <Progress value={((userGrove?.experience || 0) % 100)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}