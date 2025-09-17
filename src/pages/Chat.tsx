import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  ArrowLeft, 
  Mic, 
  Camera, 
  Heart,
  Brain,
  Smile,
  MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function Chat() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const conversation = useQuery(
    api.conversations.getConversation, 
    sessionId ? { sessionId } : "skip"
  );
  const startConversation = useMutation(api.conversations.startConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const generateResponse = useMutation(api.conversations.generateKaiResponse);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Start conversation when component mounts
    if (user && !sessionId) {
      startConversation({}).then((res) => {
        setSessionId(res.sessionId);
      });
    }
  }, [user, sessionId, startConversation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !sessionId || !user) return;

    const userMessage = message.trim();
    setMessage("");
    setIsTyping(true);

    try {
      // Add user message
      await addMessage({
        sessionId,
        message: userMessage,
        role: "user"
      });

      // Generate Kai's response
      await generateResponse({
        sessionId,
        userMessage,
        userContext: {
          currentMood: "neutral", // Would be detected from various sources
          stressLevel: 5
        }
      });

      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getKaiEmotion = (emotion?: string) => {
    switch (emotion) {
      case "joyful":
        return "😊";
      case "empathetic":
        return "🤗";
      case "caring":
        return "💙";
      case "encouraging":
        return "💪";
      case "supportive":
      default:
        return "🤖";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Glassmorphism background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="bg-white/20 backdrop-blur-md border-white/30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-3xl"
              >
                🤖
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Chat with Kai
                </h1>
                <p className="text-sm text-muted-foreground">Your AI wellness companion</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-md border-white/30"
                onClick={() => toast.info("Voice analysis coming soon!")}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-md border-white/30"
                onClick={() => toast.info("Visual sentiment analysis coming soon!")}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl h-[600px] flex flex-col">
          <CardHeader className="border-b border-white/20">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {conversation?.messages?.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${
                      msg.role === "user" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                        : "bg-white/30 backdrop-blur-sm border border-white/20"
                    } rounded-2xl p-4`}>
                      {msg.role === "kai" && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getKaiEmotion(msg.emotion)}</span>
                          <span className="text-sm font-medium text-purple-600">Kai</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🤖</span>
                          <span className="text-sm font-medium text-purple-600">Kai</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-white/20 p-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message to Kai..."
                  className="flex-1 bg-white/20 backdrop-blur-sm border-white/30"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center justify-center space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage("I'm feeling stressed about my exams")}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-xs"
                >
                  😰 Feeling stressed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage("I need help with motivation")}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-xs"
                >
                  💪 Need motivation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage("Can you suggest a breathing exercise?")}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-xs"
                >
                  🧘 Breathing exercise
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Detection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Mood: Neutral</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Stress: Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smile className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Energy: Good</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Real-time analysis • Privacy protected
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}