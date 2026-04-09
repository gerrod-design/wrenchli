import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, ImagePlus, Camera, History, MessageSquarePlus, Mic, MicOff, Volume2, VolumeX, Film, ScanLine, Keyboard } from "lucide-react";
import AudioRecordButton from "./chatbot/AudioRecordButton";
import MechanicAvatar, { type AgentType } from "./MechanicAvatar";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import YouTubePreviewCard, { isYouTubeUrl } from "./chatbot/YouTubePreviewCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Msg } from "./chatbot/types";
import { streamChat } from "./chatbot/streamChat";
import { useChatHistory } from "./chatbot/useChatHistory";
import { MessageActions } from "./chatbot/MessageActions";
import { ConversationList } from "./chatbot/ConversationList";
import { useSharedVoiceChat } from "@/contexts/VoiceChatContext";
import AudioWaveform from "./chatbot/AudioWaveform";
import { extractVideoFrames, isVideoFile, MAX_VIDEO_SIZE } from "@/lib/videoFrameExtractor";
import { extractVideoAudio } from "@/lib/videoAudioExtractor";
import { decodeVin, sanitizeVin, isValidVin, type DecodedVehicle } from "@/lib/vinDecoder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WELCOME_MESSAGE = `👋 Hey there! I'm Mike, your Wrenchli advisor. Whether you're dealing with an issue or just want to stay ahead of one — I've got you.`;

const AGENT_META: Record<AgentType, { name: string; role: string; color: string }> = {
  mike: { name: "Mike", role: "Lead Advisor", color: "bg-primary" },
  sam: { name: "Sam", role: "Cost & Value Specialist", color: "bg-amber-500" },
  jess: { name: "Jess", role: "Parts & DIY Expert", color: "bg-emerald-500" },
  kai: { name: "Kai", role: "Finance Specialist", color: "bg-sky-500" },
  priya: { name: "Priya", role: "Prevention Coach", color: "bg-violet-500" },
};

function detectAgent(content: unknown): AgentType {
  const text = typeof content === "string" ? content : "";
  if (/\[Agent:\s*Sam\]/i.test(text)) return "sam";
  if (/\[Agent:\s*Jess\]/i.test(text)) return "jess";
  return "mike";
}

function cleanAgentMarker(content: unknown): string {
  const text = typeof content === "string" ? content : "";
  return text.replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "");
}

function getAgentMeta(agent: AgentType | null | undefined) {
  return AGENT_META[agent ?? "mike"] ?? AGENT_META.mike;
}

export default function ChatBot() {
  const VOICE_OWNER = "floating-chatbot";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const {
    messages, setMessages, conversations, activeId,
    startNewChat, switchConversation, removeConversation, renameConversation, togglePin, clearAllHistory,
  } = useChatHistory();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [vinModalOpen, setVinModalOpen] = useState(false);
  const [vinText, setVinText] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [hasInteracted, setHasInteracted] = useState(() =>
    localStorage.getItem("wrenchli_chat_interacted") === "true"
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const {
    voiceEnabled, toggleVoice, isListening, isSpeaking, transcript, setTranscript,
    startListening, stopListening, speak, stopSpeaking, unlockAudioPlayback, supportsSTT, supportsTTS, silenceCountdown, voiceOwner, waitForSpeechEnd,
  } = useSharedVoiceChat();

  const speakRef = useRef(speak);
  const waitForSpeechEndRef = useRef(waitForSpeechEnd);
  const voiceEnabledStateRef = useRef(voiceEnabled);
  const voiceOwnerRef = useRef<string | null>(voiceOwner);
  speakRef.current = speak;
  waitForSpeechEndRef.current = waitForSpeechEnd;
  voiceEnabledStateRef.current = voiceEnabled;
  voiceOwnerRef.current = voiceOwner;
  // Show toast when chat opens with restored conversations
  const hasShownRestoredToast = useRef(false);
  useEffect(() => {
    if (open && !hasShownRestoredToast.current) {
      const restoredCount = conversations.filter((c) => c.messages.length > 0).length;
      if (restoredCount > 0) {
        toast.info(
          `${restoredCount} previous conversation${restoredCount > 1 ? "s" : ""} restored`,
          { duration: 3000 }
        );
      }
      hasShownRestoredToast.current = true;
    }
  }, [open, conversations]);

  // When transcript changes (from voice input), update input field
  useEffect(() => {
    if (transcript && voiceOwner === VOICE_OWNER) setInput(transcript);
  }, [transcript, voiceOwner]);


  // Mark as interacted
  const markInteracted = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem("wrenchli_chat_interacted", "true");
    }
  }, [hasInteracted]);

  // Auto-open on first visit after 5 seconds
  useEffect(() => {
    const alreadyOpened = localStorage.getItem("wrenchli_chat_opened") === "true";
    if (alreadyOpened) return;

    const timer = setTimeout(() => {
      setOpen(true);
      setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
      localStorage.setItem("wrenchli_chat_opened", "true");
      markInteracted();
    }, 5000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are supported."); return null; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB."); return null; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("damage-photos").upload(path, file, { contentType: file.type });
    if (error) { console.error("Upload error:", error); toast.error("Failed to upload photo."); return null; }
    const { data: urlData } = supabase.storage.from("damage-photos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 5 - pendingPhotos.length;
    if (remaining <= 0) { toast.error("Maximum 5 photos per message."); return; }
    setUploading(true);

    const allFiles = Array.from(files);
    const videoFile = allFiles.find(isVideoFile);

    if (videoFile) {
      if (videoFile.size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 50MB.");
        setUploading(false);
        return;
      }
      toast.info("🎬 Extracting frames & audio from video…", { duration: 8000 });
      try {
        const [frames, audioBlob] = await Promise.all([
          extractVideoFrames(videoFile, Math.min(4, remaining)),
          extractVideoAudio(videoFile),
        ]);

        const uploaded: string[] = [];
        for (const frame of frames) {
          const url = await uploadPhoto(frame);
          if (url) uploaded.push(url);
        }
        if (uploaded.length) {
          setPendingPhotos((prev) => [...prev, ...uploaded]);

          toast.info(audioBlob ? "🔊 Analyzing video frames + audio…" : "📸 Analyzing video frames…", { duration: 10000 });

          const vehicleStr = sessionStorage.getItem("wrenchli_vehicle") || "";
          const formData = new FormData();
          formData.append("frame_urls", JSON.stringify(uploaded));
          if (vehicleStr) formData.append("vehicle_context", vehicleStr);
          if (audioBlob) {
            formData.append("audio", new File([audioBlob], "video-audio.wav", { type: "audio/wav" }));
          }

          const analyzeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video-combined`;
          fetch(analyzeUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: formData,
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.analysis) {
                const label = data.has_audio
                  ? `🎬🔊 [Analyzed video: ${data.frame_count} frames + audio]`
                  : `🎬 [Analyzed video: ${data.frame_count} frames, no audio detected]`;
                const userMsg: Msg = { role: "user", content: label, image_urls: uploaded };
                const assistantMsg: Msg = { role: "assistant", content: data.analysis };
                setMessages((prev) => [...prev, userMsg, assistantMsg]);
                setPendingPhotos((p) => p.filter((url) => !uploaded.includes(url)));
              }
            })
            .catch(() => {
              toast.success(`📸 Extracted ${uploaded.length} frames — send a message to analyze`);
            });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to process video.");
      }
    } else {
      const uploaded: string[] = [];
      for (const file of allFiles.slice(0, remaining)) {
        const url = await uploadPhoto(file);
        if (url) uploaded.push(url);
      }
      if (uploaded.length > 0) setPendingPhotos((prev) => [...prev, ...uploaded]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e.dataTransfer.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const removePendingPhoto = (index: number) => setPendingPhotos((prev) => prev.filter((_, i) => i !== index));

  const ensureActiveConversation = useCallback((): string => {
    if (activeId) return activeId;
    return startNewChat();
  }, [activeId, startNewChat]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if ((!text && pendingPhotos.length === 0) || loading) return;
    const convId = ensureActiveConversation();
    setInput("");
    const userMsg: Msg = {
      role: "user",
      content: text || "Please analyze this vehicle damage.",
      ...(pendingPhotos.length > 0 ? { image_urls: [...pendingPhotos] } : {}),
    };
    setPendingPhotos([]);
    setMessages((prev) => [...prev, userMsg], convId);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      }, convId);
    };

    // Build vehicle context from sessionStorage
    const vehicleStr = sessionStorage.getItem("wrenchli_vehicle") || "";
    let vehicleContext: { year?: string; make?: string; model?: string; mileage?: number } | undefined;
    if (vehicleStr) {
      const parts = vehicleStr.split(" ");
      if (parts.length >= 3) {
        vehicleContext = { year: parts[0], make: parts[1], model: parts.slice(2).join(" ") };
      }
    }
    // Also check for mileage in garage vehicles via localStorage
    try {
      const garageData = localStorage.getItem("wrenchli_garage");
      if (garageData && vehicleContext) {
        const garage = JSON.parse(garageData);
        const match = Array.isArray(garage) && garage.find((v: any) =>
          v.year === vehicleContext!.year && v.make === vehicleContext!.make && v.model === vehicleContext!.model
        );
        if (match?.mileage) vehicleContext.mileage = match.mileage;
      }
    } catch { /* ignore */ }

    try {
      await streamChat({
        messages: [...messages, userMsg],
        vehicleContext,
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          const activeOwner = voiceOwnerRef.current;
          const canSpeak =
            voiceEnabledStateRef.current && (!activeOwner || activeOwner === VOICE_OWNER);
          console.log("[VoiceDebug:ChatBot] onDone → voiceEnabled:", voiceEnabledStateRef.current, "owner:", activeOwner, "VOICE_OWNER:", VOICE_OWNER, "canSpeak:", canSpeak, "textLen:", assistantSoFar.trim().length);
          if (canSpeak && assistantSoFar.trim()) {
            void speakRef.current(assistantSoFar, detectAgent(assistantSoFar));
          }
          // Auto-follow-up when an agent announces a handoff to another specialist
          const finalText = assistantSoFar;
          const announcesHandoff = /bring(?:ing)?\s+(?:in\s+)?(?:her|him|them|Sam|Jess)\b|let me (?:get|bring|hand|connect)|handing.*(?:over|off)|I'(?:m|ll)\s+(?:going to\s+)?(?:bring|connect|hand|let|get)|(?:let|pass(?:ing)?\s+(?:it|this)\s+to)\s+(?:Sam|Jess)\b/i.test(finalText);
          if (announcesHandoff) {
            if (canSpeak) {
              // Wait for TTS to finish the full message before triggering the handoff
              waitForSpeechEndRef.current().then(() => {
                setTimeout(() => sendRef.current("ok"), 600);
              });
            } else {
              setTimeout(() => sendRef.current("ok"), 800);
            }
          }
        },
        onError: (msg) => { upsert(msg); setLoading(false); },
      });
    } catch {
      upsert("Sorry, something went wrong. Please try again.");
      setLoading(false);
    }
  }, [input, loading, messages, pendingPhotos, setMessages, ensureActiveConversation]);

  const handleVinDecoded = useCallback((vehicle: DecodedVehicle) => {
    setVinModalOpen(false);
    setVinText("");
    setVinError("");
    const desc = `My vehicle is a ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}${vehicle.engine ? `, ${vehicle.engine}` : ""}`;
    send(desc);
  }, [send]);

  const handleVinSubmit = async () => {
    const cleaned = sanitizeVin(vinText);
    if (!isValidVin(cleaned)) {
      setVinError("VINs are exactly 17 characters (no I, O, or Q).");
      return;
    }
    setVinLoading(true);
    setVinError("");
    try {
      const vehicle = await decodeVin(cleaned);
      handleVinDecoded(vehicle);
    } catch {
      setVinError("Couldn't decode that VIN. Please try again.");
    } finally {
      setVinLoading(false);
    }
  };

  // Auto-send when voice recognition ends with transcript
  const sendRef = useRef(send);
  const lastAutoSentTranscriptRef = useRef<string | null>(null);
  sendRef.current = send;
  useEffect(() => {
    if (voiceOwner !== VOICE_OWNER || isListening || loading) return;

    const text = transcript.trim();
    if (!text) {
      lastAutoSentTranscriptRef.current = null;
      return;
    }

    if (lastAutoSentTranscriptRef.current === text) return;
    lastAutoSentTranscriptRef.current = text;

    setTranscript("");
    setInput("");
    sendRef.current(text);
  }, [isListening, transcript, setTranscript, voiceOwner, loading]);

  const SUGGESTION_CHIPS = [
    "My check engine light is on",
    "I hear a strange noise",
    "I need a repair estimate",
    "📸 Show damage photo",
  ];

  // Show voice mode onboarding once
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  useEffect(() => {
    if (!open || !supportsSTT) return;
    const seen = localStorage.getItem("wrenchli_voice_tip_seen");
    if (!seen) {
      const t = setTimeout(() => {
        setShowVoiceTip(true);
        localStorage.setItem("wrenchli_voice_tip_seen", "true");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [open, supportsSTT]);

  const handleOpenChat = () => {
    setOpen(true);
    markInteracted();
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />

      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="fixed bottom-[76px] right-4 z-40 flex h-auto w-auto items-center justify-center rounded-2xl bg-accent p-3 text-accent-foreground shadow-lg hover:opacity-90 transition-opacity md:bottom-8 md:right-6 cursor-pointer"
            onClick={handleOpenChat}
            data-chat-trigger
          >
            <div className="flex flex-col items-center gap-1">
              <MechanicAvatar size={40} />
              <span className="text-[11px] font-semibold tracking-tight">Ask Wrenchli</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-[60px] z-[45] flex flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl md:inset-x-auto md:bottom-8 md:right-6 md:w-[340px] md:max-w-[calc(100vw-2rem)] md:rounded-2xl"
            style={{ height: isMobile ? "calc(100dvh - 60px)" : "min(440px, calc(100vh - 10rem))", WebkitTransform: "translate3d(0,0,0)", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-3">
              <span className="font-semibold text-primary-foreground text-sm">Wrenchli Assistant</span>
              <div className="flex items-center gap-1.5">
                {(supportsSTT || supportsTTS) && (
                  <div className="relative">
                    <button
                      onClick={async () => {
                        const turningOn = !voiceEnabled;
                        if (turningOn) {
                          const unlocked = await unlockAudioPlayback();
                          if (!unlocked) {
                            toast.warning("Speaker audio may stay muted for now, but voice mode is still enabled.");
                          }
                        }
                        toggleVoice();
                        setShowVoiceTip(false);
                        if (turningOn) {
                          toast.success("🎙️ Voice mode on — I'll speak my responses and listen for yours!", { duration: 3000 });
                          if (supportsSTT) {
                            setTimeout(() => {
                              const started = startListening(VOICE_OWNER);
                              if (!started) {
                                toast.error("Microphone access is blocked. Please allow mic permission and try again.");
                              }
                            }, 0);
                          }
                        } else {
                          stopListening(VOICE_OWNER);
                          stopSpeaking();
                        }
                      }}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all ${
                        voiceEnabled
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      }`}
                      aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
                      title={voiceEnabled ? "Voice mode on" : "Voice mode off"}
                    >
                      {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{voiceEnabled ? "Voice On" : "Voice"}</span>
                    </button>
                    {showVoiceTip && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg bg-foreground text-background px-3 py-2 text-xs shadow-lg"
                      >
                        <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-foreground" />
                        🎙️ Tap here for hands-free conversations — I'll listen and speak my answers back!
                        <button onClick={() => setShowVoiceTip(false)} className="ml-1 underline opacity-70 hover:opacity-100">Got it</button>
                      </motion.div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => { startNewChat(); setShowHistory(false); }}
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  aria-label="New chat" title="New chat"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`transition-colors ${showHistory ? "text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
                  aria-label="Chat history" title="Chat history"
                >
                  <History className="h-4 w-4" />
                </button>
                <button onClick={() => { setOpen(false); setShowHistory(false); }} className="text-primary-foreground/80 hover:text-primary-foreground" aria-label="Close chat">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Active specialist bar */}
            {(() => {
              const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
              const activeAgent = lastAssistant ? detectAgent(lastAssistant.content) : "mike";
              const agentInfo = getAgentMeta(activeAgent);
              if (!messages.length || showHistory) return null;
              return (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/50 border-b border-border">
                  <span className={`h-2 w-2 rounded-full ${agentInfo.color} animate-pulse`} />
                  <span className="text-[11px] font-semibold text-foreground">{agentInfo.name}</span>
                  <span className="text-[10px] text-muted-foreground">· {agentInfo.role}</span>
                </div>
              );
            })()}

            {/* History panel or Messages */}
            {showHistory ? (
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  onSelect={switchConversation}
                  onNew={startNewChat}
                  onDelete={removeConversation}
                  onRename={renameConversation}
                  onPin={togglePin}
                  onClearAll={() => { clearAllHistory(); setShowHistory(false); toast.success("All chats cleared"); }}
                  onClose={() => setShowHistory(false)}
                />
              </div>
            ) : (
              <>
                {/* Messages */}
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                  className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 relative transition-colors ${isDragOver ? "bg-accent/10" : ""}`}
                  style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  {isDragOver && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent rounded-lg">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto text-accent mb-2" />
                        <p className="text-sm font-medium text-accent">Drop photos here</p>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div className="mt-6 space-y-4">
                      <p className="text-muted-foreground text-sm text-center px-2">
                        👋 Hey, I'm Mike — your Wrenchli advisor. How can I help?
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => send("I have an issue with my vehicle")}
                          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          🔧 I have an issue
                        </button>
                        <button
                          type="button"
                          onClick={() => send("I want to prevent problems and keep my car in good shape")}
                          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          🛡️ Prevent problems
                        </button>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTION_CHIPS.map((chip) => (
                          <button
                            key={chip} type="button"
                            onClick={() => chip.includes("photo") ? fileInputRef.current?.click() : send(chip)}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => {
                    // Hide auto-handoff "ok" messages from user
                    if (m.role === "user" && /^ok$/i.test(m.content.trim())) {
                      const nextMsg = messages[i + 1];
                      const prevMsg = messages[i - 1];
                      if (prevMsg?.role === "assistant" && nextMsg?.role === "assistant" && detectAgent(prevMsg.content) !== detectAgent(nextMsg.content)) {
                        return null;
                      }
                    }
                    let currentAgent = m.role === "assistant" ? detectAgent(m.content) : null;
                    const prevAssistant = messages.slice(0, i).reverse().find(msg => msg.role === "assistant");
                    const prevAgent = prevAssistant ? detectAgent(prevAssistant.content) : null;
                    const isLastMsg = i === messages.length - 1;
                    // If no explicit marker found (defaults to mike) but previous agent was a specialist,
                    // check if Mike is actually announcing himself or if the marker was just omitted.
                    // An explicit handoff back to Mike requires handoff language in the previous message.
                    const hasExplicitMarker = m.role === "assistant" && /\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]/i.test(typeof m.content === "string" ? m.content : "");
                    if (m.role === "assistant" && currentAgent === "mike" && !hasExplicitMarker && prevAgent && prevAgent !== "mike") {
                      // Check if the previous specialist message explicitly handed back to Mike
                      const prevText = typeof prevAssistant?.content === "string" ? prevAssistant.content : "";
                      const handsBackToMike = /\b(?:hand(?:ing)?\s+(?:it\s+)?(?:back|over)\s+to\s+Mike|let me get Mike|bringing Mike back|Mike (?:will|can) take it from here)\b/i.test(prevText);
                      if (!handsBackToMike) {
                        // Assume the specialist is still active — marker was omitted
                        currentAgent = prevAgent;
                      }
                    }
                    if (isLastMsg && loading && currentAgent === "mike" && prevAgent && prevAgent !== "mike") {
                      currentAgent = prevAgent;
                    } else if (isLastMsg && loading && currentAgent === "mike" && prevAssistant) {
                      const prevText = typeof prevAssistant.content === "string" ? prevAssistant.content : "";
                      const handoffMatch = prevText.match(/\b(Sam|Jess)\b/i);
                      if (handoffMatch) {
                        currentAgent = handoffMatch[1].toLowerCase() as AgentType;
                      }
                    }
                    const isHandoff = currentAgent && prevAgent && currentAgent !== prevAgent;
                    const agentName = getAgentMeta(currentAgent).name;

                    return (
                    <div key={i}>
                      {isHandoff && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center gap-2 py-1.5 mb-2"
                        >
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] font-medium text-muted-foreground px-2">
                            {agentName} is joining…
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </motion.div>
                      )}
                    <div className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && (
                        <motion.div
                          key={`${i}-${currentAgent}`}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20, duration: 0.3 }}
                          className="relative shrink-0"
                        >
                          <MechanicAvatar size={32} className="mt-0.5" agent={currentAgent ?? "mike"} />
                          {voiceEnabled && isSpeaking && i === messages.length - 1 && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                              <Volume2 className="h-2.5 w-2.5 text-primary-foreground animate-pulse" />
                            </span>
                          )}
                        </motion.div>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_a]:text-primary [&_a]:underline [&_a]:font-medium"
                      }`}>
                        {m.role === "user" && m.image_urls && m.image_urls.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {m.image_urls.map((url, j) => (
                              <img key={j} src={url} alt={`Attached ${j + 1}`} className="rounded-md w-full h-20 object-cover" />
                            ))}
                          </div>
                        )}
                        {m.role === "user" ? (
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        ) : (
                          <ReactMarkdown components={{
                            a: ({ href, children }) => {
                              if (href && isYouTubeUrl(href)) {
                                const linkText = typeof children === "string" ? children
                                  : Array.isArray(children) ? children.map(c => (typeof c === "string" ? c : "")).join("") : undefined;
                                return <YouTubePreviewCard href={href} title={linkText || undefined} />;
                              }
                              if (href && href.startsWith('/')) {
                                return (
                                  <button
                                    onClick={(e) => { e.preventDefault(); navigate(href); setOpen(false); }}
                                    className="text-primary underline font-medium hover:opacity-80 cursor-pointer"
                                  >
                                    {children}
                                  </button>
                                );
                              }
                              return (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium hover:opacity-80">
                                  {children}
                                </a>
                              );
                            }
                          }}>
                            {cleanAgentMarker(m.content)}
                          </ReactMarkdown>
                        )}
                      </div>
                      {m.role === "assistant" && !loading && m.content.length > 20 && (
                        <MessageActions content={m.content} />
                      )}
                    </div>
                    </div>
                    );
                  })}

                  {/* Intent quick-action buttons — show only on welcome message */}
                  {messages.length === 1 && messages[0]?.role === "assistant" && !loading && (
                    <div className="flex flex-wrap gap-2 pl-10">
                      <button
                        type="button"
                        onClick={() => send("I have an issue with my vehicle")}
                        className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        🔧 I have an issue
                      </button>
                      <button
                        type="button"
                        onClick={() => send("I want to prevent problems and keep my car in good shape")}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        🛡️ Prevent problems
                      </button>
                    </div>
                  )}

                  {loading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-secondary rounded-xl px-3 py-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground animate-pulse">
                          {messages[messages.length - 1]?.image_urls?.length ? "Analyzing damage photos…" : "Thinking…"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Pending photos */}
                {pendingPhotos.length > 0 && (
                  <div className="border-t border-border px-3 py-2 flex gap-2 overflow-x-auto">
                    {pendingPhotos.map((url, i) => (
                      <div key={i} className="relative flex-shrink-0 group">
                        <img src={url} alt={`Pending ${i + 1}`} className="h-12 w-12 rounded-md object-cover border border-border" />
                        <button onClick={() => removePendingPhoto(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                    {uploading && (
                      <div className="h-12 w-12 rounded-md border border-dashed border-border flex items-center justify-center flex-shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}

                {/* Voice status indicator */}
                {voiceEnabled && (isSpeaking || isListening) && (
                  <div className="border-t border-border px-3 py-1.5 flex items-center gap-2 bg-accent/5">
                    {isSpeaking && (
                      <>
                        <div className="flex gap-0.5 items-end h-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Speaking…</span>
                        <button onClick={stopSpeaking} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Skip</button>
                      </>
                    )}
                    {isListening && !isSpeaking && (
                      <>
                        <div className="relative h-5 w-5 flex items-center justify-center">
                          <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                            <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2"
                              strokeDasharray={`${2 * Math.PI * 8}`}
                              strokeDashoffset={`${2 * Math.PI * 8 * (1 - silenceCountdown)}`}
                              strokeLinecap="round"
                              className="transition-[stroke-dashoffset] duration-100 ease-linear" />
                          </svg>
                        </div>
                        <span className="text-xs text-muted-foreground">Listening… <span className="text-[10px] opacity-60">{Math.ceil(silenceCountdown * 4.5)}s</span></span>
                      </>
                    )}
                  </div>
                )}

                {/* Tool row with labels */}
                <div className="border-t border-border px-3 py-1.5 flex flex-wrap items-end justify-evenly gap-y-1.5">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading || pendingPhotos.length >= 5}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40" aria-label="Upload photo">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><ImagePlus className="h-4 w-4" /></span>
                    <span className="text-[11px] leading-none font-medium whitespace-nowrap">Upload Photo</span>
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading || uploading || pendingPhotos.length >= 5}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40" aria-label="Take photo">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><Camera className="h-4 w-4" /></span>
                    <span className="text-[11px] leading-none font-medium whitespace-nowrap">Take Photo</span>
                  </button>
                  <span className="flex flex-col items-center gap-1 text-muted-foreground">
                    <AudioRecordButton
                      disabled={loading || uploading}
                      onAnalysis={(analysis) => {
                        const convId = ensureActiveConversation();
                        const userMsg: Msg = { role: "user", content: "🔊 [Recorded a car noise clip for analysis]" };
                        const assistantMsg: Msg = { role: "assistant", content: analysis };
                        setMessages((prev) => [...prev, userMsg, assistantMsg], convId);
                      }}
                    />
                    <span className="text-[11px] leading-none font-medium whitespace-nowrap">Record Sound</span>
                  </span>
                  <button type="button" onClick={() => setVinModalOpen(true)} disabled={loading}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40" aria-label="Scan VIN">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><ScanLine className="h-4 w-4" /></span>
                    <span className="text-[11px] leading-none font-medium whitespace-nowrap">Scan VIN</span>
                  </button>
                </div>

                {/* Input */}
                <div className="border-t border-border">
                  <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 px-3 py-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Listening…" : pendingPhotos.length > 0 ? "Describe the damage (optional)…" : voiceEnabled ? "Tap mic or type…" : "Type a message…"}
                      maxLength={8000}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" disabled={loading} />
                    {voiceEnabled && supportsSTT && (
                      <>
                        {isListening && <AudioWaveform />}
                        <button
                          type="button"
                          onClick={async () => {
                            if (isListening) {
                              stopListening(VOICE_OWNER);
                            } else {
                              const unlocked = await unlockAudioPlayback();
                              if (!unlocked) {
                                toast.warning("Mic is on. If replies are muted, tap Voice once more to unlock speaker audio.");
                              }
                              const started = startListening(VOICE_OWNER);
                              if (!started) {
                                toast.error("Couldn't start listening. Check mic permission and try again.");
                              }
                            }
                          }}
                          disabled={loading || isSpeaking || (isListening && voiceOwner !== VOICE_OWNER)}
                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                            isListening
                              ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/50 ring-offset-1 ring-offset-background"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          aria-label={isListening ? "Stop listening" : "Start listening"}
                          title={isListening ? "Stop listening" : "Speak your message"}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          {isListening && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                            </span>
                          )}
                        </button>
                      </>
                    )}
                    <button type="submit" disabled={loading || (!input.trim() && pendingPhotos.length === 0)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                  {input.length > 7600 && (
                    <div className="px-3 pb-2 text-xs text-muted-foreground">{8000 - input.length} characters remaining</div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIN Scan/Entry Modal */}
      <Dialog open={vinModalOpen} onOpenChange={setVinModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading">Identify Your Vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your 17-character VIN to instantly identify your vehicle.</p>

          <div className="space-y-3 mt-2">
            <div className="flex gap-2">
              <Input
                value={vinText}
                onChange={(e) => { setVinText(sanitizeVin(e.target.value)); setVinError(""); }}
                placeholder="e.g. 1HGCV1F34LA000001"
                maxLength={17}
                className="font-mono tracking-wider uppercase"
                disabled={vinLoading}
              />
              <Button onClick={handleVinSubmit} disabled={vinLoading || vinText.length < 17} size="sm">
                {vinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decode"}
              </Button>
            </div>

            {vinError && <p className="text-xs text-destructive">{vinError}</p>}

            <p className="text-xs text-muted-foreground leading-relaxed">
              <Keyboard className="inline h-3 w-3 mr-1 -mt-0.5" />
              Find your VIN on the driver-side door jamb sticker or the bottom-left corner of your windshield.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
