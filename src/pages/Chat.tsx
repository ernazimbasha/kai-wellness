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
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";

export default function Chat() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add: media & analysis state
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const voiceDataArrayRef = useRef<Uint8Array | null>(null);
  const [voiceMetrics, setVoiceMetrics] = useState<{ volume: number; zcr: number }>(
    { volume: 0, zcr: 0 }
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const [visualMetrics, setVisualMetrics] = useState<{ brightness: number; motion: number }>(
    { brightness: 0, motion: 0 }
  );

  // Adaptive Audioscape
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const calmingTracks = useMemo(() => ([
    // Public domain/royalty-free ambient tracks
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_6e9f0436ec.mp3?filename=ambient-piano-112191.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/10/audio_6d6a12f90d.mp3?filename=relaxing-ambient-111154.mp3",
  ]), []);

  // Queries and mutations
  const conversation = useQuery(
    api.conversations.getConversation, 
    sessionId ? { sessionId } : "skip"
  );
  const startConversation = useMutation(api.conversations.startConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const generateResponse = useMutation(api.conversations.generateKaiResponse);
  const createMood = useMutation(api.moods.createMood);

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
    // Initialize audio element once
    if (!audioRef.current) {
      const a = new Audio(calmingTracks[0]);
      a.loop = true;
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }
  }, [calmingTracks]);

  // Voice analysis loop
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const analyser = analyserRef.current;
      const dataArray = voiceDataArrayRef.current;
      if (micOn && analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray);
        // Compute RMS volume and zero-crossing rate
        let sum = 0;
        let zc = 0;
        let prev = dataArray[0];
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128; // -1..1
          sum += v * v;
          if ((prev - 128) * (dataArray[i] - 128) < 0) zc++;
          prev = dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length); // 0..~1
        const zcr = zc / dataArray.length; // 0..~0.5
        setVoiceMetrics({ volume: Number((rms * 100).toFixed(1)), zcr: Number(zcr.toFixed(3)) });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [micOn]);

  // Camera analysis loop
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (camOn && video && canvas) {
        const w = 160, h = 120;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          // brightness
          let sum = 0;
          for (let i = 0; i < frame.data.length; i += 4) {
            sum += (0.2126 * frame.data[i] + 0.7152 * frame.data[i + 1] + 0.0722 * frame.data[i + 2]);
          }
          const brightness = sum / (w * h) / 255; // 0..1
          // motion via absolute diff with previous frame
          let motion = 0;
          if (prevFrameRef.current) {
            const prev = prevFrameRef.current;
            let diffSum = 0;
            for (let i = 0; i < frame.data.length; i += 4) {
              const dR = Math.abs(frame.data[i] - prev.data[i]);
              const dG = Math.abs(frame.data[i + 1] - prev.data[i + 1]);
              const dB = Math.abs(frame.data[i + 2] - prev.data[i + 2]);
              diffSum += (dR + dG + dB) / 3;
            }
            motion = diffSum / (w * h) / 255; // 0..1
          }
          prevFrameRef.current = frame;
          setVisualMetrics({ brightness: Number(brightness.toFixed(2)), motion: Number(motion.toFixed(2)) });
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [camOn]);

  // Derived stress score and mood
  const stressScore = useMemo(() => {
    // Simple weighted combo: voice volume + motion; brightness low can contribute
    const vol = Math.min(voiceMetrics.volume / 50, 1); // normalize
    const motion = visualMetrics.motion; // 0..1
    const lowLight = visualMetrics.brightness < 0.25 ? 0.2 : 0;
    return Math.min(1, 0.6 * vol + 0.3 * motion + 0.1 * lowLight);
  }, [voiceMetrics, visualMetrics]);
  const stressLabel = stressScore > 0.66 ? "High" : stressScore > 0.33 ? "Medium" : "Low";
  const moodLabel = stressScore > 0.66 ? "Low" : stressScore < 0.33 ? "Good" : "Neutral";

  // Adaptive audio reaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioOn) {
      audio.volume = 0.2 + stressScore * 0.5; // louder when higher stress
      audio.playbackRate = 0.9 + (1 - stressScore) * 0.2; // calmer (slower) when stress is high
    }
  }, [audioOn, stressScore]);

  // Proactive mood logging when stress spikes
  const lastLoggedRef = useRef<number>(0);
  useEffect(() => {
    const now = Date.now();
    if (stressScore > 0.75 && now - lastLoggedRef.current > 60_000 && user && sessionId) {
      lastLoggedRef.current = now;
      // Fire-and-forget minimal mood record
      createMood({
        mood: stressScore > 0.85 ? "very_low" : "low",
        intensity: Math.round(stressScore * 10),
        detectionMethod: camOn && micOn ? "voice_visual" : micOn ? "voice" : "visual",
        notes: "Auto-detected by on-device analysis",
      } as any).catch(() => {});
    }
  }, [stressScore, camOn, micOn, user, sessionId, createMood]);

  // Breathing guide
  const [breathingOn, setBreathingOn] = useState(false);

  // Toggle mic
  const toggleMic = async () => {
    try {
      if (micOn) {
        setMicOn(false);
        analyserRef.current?.disconnect();
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        toast.success("Voice analysis stopped");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      voiceDataArrayRef.current = new Uint8Array(analyser.fftSize);
      source.connect(analyser);
      setMicOn(true);
      toast.success("Voice analysis started (on-device)");
    } catch (e) {
      console.error(e);
      toast.error("Microphone permission denied");
    }
  };

  // Toggle camera
  const toggleCam = async () => {
    try {
      if (camOn) {
        setCamOn(false);
        camStreamRef.current?.getTracks().forEach(t => t.stop());
        camStreamRef.current = null;
        toast.success("Camera analysis stopped");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      camStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
      toast.success("Camera analysis started (on-device)");
    } catch (e) {
      console.error(e);
      toast.error("Camera permission denied");
    }
  };

  // Toggle adaptive audio
  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioOn) {
      setAudioOn(false);
      audio.pause();
      return;
    }
    // pick track based on stress
    audio.src = calmingTracks[stressScore > 0.66 ? 1 : 0];
    try {
      await audio.play();
      setAudioOn(true);
      toast.success("Adaptive audioscape playing");
    } catch {
      toast.error("Autoplay blocked. Tap again to start audio.");
    }
  };

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
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Mood: {moodLabel}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Stress: {stressLabel}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smile className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Voice vol: {voiceMetrics.volume.toFixed(1)} | ZCR: {voiceMetrics.zcr.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smile className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">
                      Brightness: {visualMetrics.brightness.toFixed(2)} | Motion: {visualMetrics.motion.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Real-time analysis • On-device
                </div>
              </div>

              {/* Embodied Breathing Guide */}
              {breathingOn && (
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm mb-2">Follow my pace: Inhale 4 • Hold 4 • Exhale 6</div>
                    <div className="relative h-24 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/50 to-blue-500/50 border border-white/30 shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="w-24 text-4xl text-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    >
                      🤖
                    </motion.div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Hidden media elements */}
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}