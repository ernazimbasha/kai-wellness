import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Brain, 
  Heart, 
  Leaf, 
  BookOpen, 
  Sparkles, 
  Shield, 
  Users, 
  TrendingUp,
  MessageCircle,
  Camera,
  Mic,
  Music,
  ArrowRight,
  Star,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router";
/* removed unused hooks */

function MiniKaiBotSVG() {
  return (
    <motion.svg
      width="92"
      height="92"
      viewBox="0 0 92 92"
      role="img"
      aria-label="Mini Kai robot assistant"
      className="drop-shadow-sm"
    >
      {/* Body */}
      <motion.g
        animate={{ scale: [1, 1.03, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      >
        <rect x="18" y="22" rx="14" ry="14" width="56" height="48" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.6)" />
        {/* Face panel */}
        <rect x="24" y="28" rx="10" ry="10" width="44" height="20" fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.6)" />
        {/* Eyes */}
        <motion.circle
          cx="38"
          cy="38"
          r="3"
          fill="#6D28D9"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
          style={{ transformOrigin: "38px 38px" }}
        />
        <motion.circle
          cx="54"
          cy="38"
          r="3"
          fill="#2563EB"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4 }}
          style={{ transformOrigin: "54px 38px" }}
        />
        {/* Smile */}
        <path d="M36 44 Q46 50 56 44" stroke="#4F46E5" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Indicator light */}
        <motion.circle cx="64" cy="30" r="3" fill="#22C55E" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} />
        {/* Antenna */}
        <line x1="46" y1="22" x2="46" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
        <motion.circle cx="46" cy="10" r="3" fill="#F59E0B" animate={{ y: [0, -2, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
        {/* Arms */}
        <motion.g
          transform="translate(18,0)"
          animate={{ rotate: [0, 18, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatType: "mirror" }}
          style={{ transformOrigin: "10px 40px" }}
        >
          <rect x="6" y="40" rx="4" ry="4" width="10" height="4" fill="rgba(255,255,255,0.7)" />
          <circle cx="6" cy="42" r="3" fill="rgba(255,255,255,0.7)" />
        </motion.g>
        <g transform="translate(0,0)">
          <rect x="76" y="40" rx="4" ry="4" width="10" height="4" fill="rgba(255,255,255,0.7)" />
          <circle cx="86" cy="42" r="3" fill="rgba(255,255,255,0.7)" />
        </g>
        {/* Legs */}
        <rect x="30" y="66" rx="3" ry="3" width="10" height="14" fill="rgba(255,255,255,0.7)" />
        <rect x="52" y="66" rx="3" ry="3" width="10" height="14" fill="rgba(255,255,255,0.7)" />
      </motion.g>

      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export default function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: "AI Companion Kai",
      description: "Your empathetic AI friend who understands student life and provides personalized support 24/7.",
      color: "text-purple-500"
    },
    {
      icon: Brain,
      title: "Proactive Stress Detection",
      description: "Advanced pattern recognition that identifies stress before it overwhelms you.",
      color: "text-blue-500"
    },
    {
      icon: Mic,
      title: "Vocal Biomarker Analysis",
      description: "Detect stress and energy levels through voice tone analysis - all processed on your device.",
      color: "text-green-500"
    },
    {
      icon: Camera,
      title: "Visual Sentiment Sensing",
      description: "Camera-based mood detection to identify burnout and distraction patterns.",
      color: "text-orange-500"
    },
    {
      icon: Music,
      title: "Adaptive Audioscape",
      description: "Culturally relevant music and soundscapes that adapt to your mood and activities.",
      color: "text-pink-500"
    },
    {
      icon: Leaf,
      title: "Mindful Grove",
      description: "Gamified wellness journey where your virtual garden grows as you complete activities.",
      color: "text-emerald-500"
    }
  ];

  const testimonials = [
    {
      name: "Priya S.",
      role: "Computer Science Student",
      content: "Kai helped me manage exam stress better than any app I've tried. The breathing exercises are perfect for study breaks!",
      rating: 5
    },
    {
      name: "Alex M.",
      role: "Graduate Student",
      content: "The grove feature is addictive in the best way. I actually look forward to my wellness activities now.",
      rating: 5
    },
    {
      name: "Sarah L.",
      role: "Pre-Med Student",
      content: "Having an AI friend who understands student life has been a game-changer for my mental health.",
      rating: 5
    }
  ];

  // removed cursor-following state and effects to keep Kai static on screen

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Glassmorphism background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Static Mini Kai (no cursor-following) removed floating tracker */}

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Kai
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
              >
                {user ? "Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="mb-4 flex items-center justify-center"
              >
                <MiniKaiBotSVG />
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Meet Kai
                </span>
                <br />
                <span className="text-3xl md:text-4xl text-muted-foreground">
                  Your AI Friend for Student Wellness
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                An empathetic AI companion that understands student life, detects stress before it overwhelms you, 
                and guides you through personalized wellness activities. Built with privacy-first technology.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-xl text-lg px-8 py-4"
              >
                {user ? "Go to Dashboard" : "Start Your Wellness Journey"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/chat")}
                className="bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 text-lg px-8 py-4"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Try Demo Chat
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>10,000+ Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Advanced Wellness Technology
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge AI and biometric analysis designed specifically for student mental health
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Demo Flow Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                How Kai Helps You Thrive
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience a seamless wellness journey tailored for student life
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Kai Greets You</h3>
                  <p className="text-muted-foreground">Your AI companion waves hello and checks in on your current state with a friendly, understanding approach.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Mood Detection</h3>
                  <p className="text-muted-foreground">Through text, voice, or camera analysis, Kai understands your emotional state and stress levels.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personalized Activities</h3>
                  <p className="text-muted-foreground">Receive tailored suggestions for breathing exercises, meditation, journaling, or music therapy.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Grove Growth</h3>
                  <p className="text-muted-foreground">Watch your virtual garden flourish as you complete wellness activities and build healthy habits.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl p-8">
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-6xl"
                  >
                    🤖
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Hi there! 👋</h3>
                    <p className="text-muted-foreground">I'm Kai, your wellness companion. How are you feeling today?</p>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Loved by Students Worldwide
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Kai is transforming student wellness across campuses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-white/30 shadow-xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-4xl font-bold tracking-tight mb-4">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Ready to Transform Your Wellness?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of students who've discovered a better way to manage stress, 
                  build healthy habits, and thrive in their academic journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-xl text-lg px-8 py-4"
                  >
                    {user ? "Continue Your Journey" : "Start Free Today"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Privacy protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>No commitment</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-white/20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Kai
              </span>
            </div>
            <p className="text-muted-foreground">
              Empowering student wellness through AI companionship
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}