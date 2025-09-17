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
  Smile
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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
    navigate(`/activity/${type}`);
  };

  const handleOpenChat = () => {
    navigate("/chat");
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
            <Button 
              onClick={handleOpenChat}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Kai
            </Button>
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
        <Tabs defaultValue="overview" className="space-y-6">
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
                            onClick={() => handleStartActivity(rec.type)}
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
                      onClick={() => handleStartActivity("breathing")}
                    >
                      <Brain className="h-6 w-6 mb-2 text-blue-500" />
                      <span className="text-sm">Breathing</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => handleStartActivity("meditation")}
                    >
                      <Heart className="h-6 w-6 mb-2 text-purple-500" />
                      <span className="text-sm">Meditation</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => navigate("/journal")}
                    >
                      <BookOpen className="h-6 w-6 mb-2 text-green-500" />
                      <span className="text-sm">Journal</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-white/30 backdrop-blur-sm border-white/20 hover:bg-white/40"
                      onClick={() => navigate("/grove")}
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
                        onClick={() => navigate("/grove")}
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
