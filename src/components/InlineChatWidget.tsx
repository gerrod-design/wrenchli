import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ImagePlus, Camera, ScanLine, Keyboard, Mic, MicOff, Volume2, Film } from "lucide-react";
import AudioRecordButton from "./chatbot/AudioRecordButton";
import ToolHint from "./chatbot/ToolHint";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import YouTubePreviewCard, { isYouTubeUrl } from "./chatbot/YouTubePreviewCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Msg } from "./chatbot/types";
import { streamChat } from "./chatbot/streamChat";
import MechanicAvatar, { type AgentType } from "./MechanicAvatar";
import { sanitizeVin, isValidVin, decodeVin, type DecodedVehicle } from "@/lib/vinDecoder";
import { extractVideoFrames, isVideoFile, MAX_VIDEO_SIZE } from "@/lib/videoFrameExtractor";
import { extractVideoAudio } from "@/lib/videoAudioExtractor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AudioWaveform from "./chatbot/AudioWaveform";
import { useSharedVoiceChat } from "@/contexts/VoiceChatContext";

const GREETING = "👋 Hey there! I'm Mike, your Wrenchli advisor. Whether you're dealing with an issue or just want to stay ahead of one — I've got you.";

const AGENT_META: Record<AgentType, { name: string; role: string; color: string }> = {
  mike: { name: "Mike", role: "Lead Advisor", color: "bg-primary" },
  sam: { name: "Sam", role: "Cost & Value Specialist", color: "bg-amber-500" },
  jess: { name: "Jess", role: "Parts & DIY Expert", color: "bg-emerald-500" },
  kai: { name: "Kai", role: "Finance Specialist", color: "bg-sky-500" },
  priya: { name: "Priya", role: "Prevention Coach", color: "bg-violet-500" },
};

/** Detect agent markers like [Agent: Sam] in message content */
function detectAgent(content: unknown): AgentType {
  const text = typeof content === "string" ? content : "";
  if (/\[Agent:\s*Sam\]/i.test(text)) return "sam";
  if (/\[Agent:\s*Jess\]/i.test(text)) return "jess";
  return "mike";
}

/** Strip agent markers from displayed content */
function cleanAgentMarker(content: unknown): string {
  const text = typeof content === "string" ? content : "";
  return text.replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "");
}

function getAgentMeta(agent: AgentType | null | undefined) {
  return AGENT_META[agent ?? "mike"] ?? AGENT_META.mike;
}

export default function InlineChatWidget() {
  const VOICE_OWNER = "inline-chat-widget";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [vinModalOpen, setVinModalOpen] = useState(false);
  const [vinText, setVinText] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const vinCameraRef = useRef<HTMLInputElement>(null);

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

  // When transcript changes (from voice input), update input field
  useEffect(() => {
    if (transcript && voiceOwner === VOICE_OWNER) setInput(transcript);
  }, [transcript, voiceOwner]);

  useEffect(() => {
    // Only scroll within the chat container, not the whole page
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are supported."); return null; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB."); return null; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("damage-photos").upload(path, file, { contentType: file.type });
    if (error) { toast.error("Failed to upload photo."); return null; }
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
      // Handle video: extract frames + audio for combined analysis
      if (videoFile.size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 50MB.");
        setUploading(false);
        return;
      }
      toast.info("🎬 Extracting frames & audio from video…", { duration: 8000 });
      try {
        // Extract frames and audio in parallel
        const [frames, audioBlob] = await Promise.all([
          extractVideoFrames(videoFile, Math.min(4, remaining)),
          extractVideoAudio(videoFile),
        ]);

        // Upload frames
        const uploaded: string[] = [];
        for (const frame of frames) {
          const url = await uploadPhoto(frame);
          if (url) uploaded.push(url);
        }

        if (uploaded.length) {
          setPendingPhotos((p) => [...p, ...uploaded]);

          // Run combined video+audio analysis in background
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
                // Clear pending photos since they're now in the message
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
      // Handle images normally
      const uploaded: string[] = [];
      for (const file of allFiles.slice(0, remaining)) {
        const url = await uploadPhoto(file);
        if (url) uploaded.push(url);
      }
      if (uploaded.length) setPendingPhotos((p) => [...p, ...uploaded]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingPhoto = (i: number) => setPendingPhotos((p) => p.filter((_, idx) => idx !== i));

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if ((!text && pendingPhotos.length === 0) || loading) return;
    setInput("");
    const userMsg: Msg = {
      role: "user",
      content: text || "Please analyze this vehicle damage.",
      ...(pendingPhotos.length > 0 ? { image_urls: [...pendingPhotos] } : {}),
    };
    setPendingPhotos([]);
    setMessages((prev) => [...prev, userMsg]);
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
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          const activeOwner = voiceOwnerRef.current;
          const canSpeak =
            voiceEnabledStateRef.current && activeOwner === VOICE_OWNER;
          console.log("[VoiceDebug:InlineChat] onDone → voiceEnabled:", voiceEnabledStateRef.current, "owner:", activeOwner, "VOICE_OWNER:", VOICE_OWNER, "canSpeak:", canSpeak, "textLen:", assistantSoFar.trim().length);
          if (canSpeak && assistantSoFar.trim()) {
            void speakRef.current(assistantSoFar, detectAgent(assistantSoFar));
          }
          // Auto-follow-up when an agent announces a handoff to another specialist
          const finalText = assistantSoFar;
          const announcesHandoff = /bring(?:ing)?\s+(?:in\s+)?(?:her|him|them|Sam|Jess)\b|let me (?:get|bring|hand|connect)|handing.*(?:over|off)|I'(?:m|ll)\s+(?:going to\s+)?(?:bring|connect|hand|let|get)|(?:let|pass(?:ing)?\s+(?:it|this)\s+to)\s+(?:Sam|Jess)\b/i.test(finalText);
          if (announcesHandoff) {
            if (canSpeak) {
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
  }, [input, loading, messages, pendingPhotos]);

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

  const QUICK_PROMPTS = [
    "My check engine light is on",
    "I hear a strange noise",
    "What's my car worth?",
    "📸 Show damage photo",
    "🎤 Record car noise",
    "🔍 Scan VIN",
  ];

  return (
    <section id="quote" className="relative -mt-8 z-10">
      <div className="container-wrenchli">
        <h2 className="text-center font-heading text-lg md:text-2xl font-semibold text-foreground mb-5">
          Ready? Start here.
        </h2>

        <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />

          {/* Active specialist indicator */}
          {messages.length > 0 && (() => {
            const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
            const activeAgent = lastAssistant ? detectAgent(lastAssistant.content) : "mike";
            const agentInfo = getAgentMeta(activeAgent);

            return (
              <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-muted/30">
                <span className={`h-2 w-2 rounded-full ${agentInfo.color} animate-pulse`} />
                <span className="text-[11px] font-semibold text-foreground">{agentInfo.name}</span>
                <span className="text-[10px] text-muted-foreground">· {agentInfo.role}</span>
              </div>
            );
          })()}

          {/* Chat messages area */}
          <div className="overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: isMobile ? "350px" : "380px", minHeight: "200px", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
            {messages.map((m, i) => {
              // Hide auto-handoff "ok" messages from user
              if (m.role === "user" && /^ok$/i.test(m.content.trim())) {
                const nextMsg = messages[i + 1];
                const prevMsg = messages[i - 1];
                if (prevMsg?.role === "assistant" && nextMsg?.role === "assistant" && detectAgent(prevMsg.content) !== detectAgent(nextMsg.content)) {
                  return null;
                }
              }
              // Detect agent handoff
              let currentAgent = m.role === "assistant" ? detectAgent(m.content) : null;
              const prevAssistant = messages.slice(0, i).reverse().find((msg) => msg.role === "assistant");
              const prevAgent = prevAssistant ? detectAgent(prevAssistant.content) : null;
              const isLastMsg = i === messages.length - 1;
              // If no explicit marker found (defaults to mike) but previous agent was a specialist,
              // assume continuity unless the specialist explicitly handed back to Mike.
              const hasExplicitMarker = m.role === "assistant" && /\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]/i.test(typeof m.content === "string" ? m.content : "");
              if (m.role === "assistant" && currentAgent === "mike" && !hasExplicitMarker && prevAgent && prevAgent !== "mike") {
                const prevText = typeof prevAssistant?.content === "string" ? prevAssistant.content : "";
                const handsBackToMike = /\b(?:hand(?:ing)?\s+(?:it\s+)?(?:back|over)\s+to\s+Mike|let me get Mike|bringing Mike back|Mike (?:will|can) take it from here)\b/i.test(prevText);
                if (!handsBackToMike) {
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
                <div className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (() => {
                  const agent = currentAgent ?? "mike";
                  return (
                    <motion.div
                      key={`${i}-${agent}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20, duration: 0.3 }}
                      className="relative flex flex-col items-center gap-0.5 shrink-0"
                    >
                      <MechanicAvatar size={36} className="mt-0.5" agent={agent} />
                      {voiceEnabled && isSpeaking && i === messages.length - 1 && (
                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                          <Volume2 className="h-2.5 w-2.5 text-primary-foreground animate-pulse" />
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-muted-foreground leading-none">
                        {agent === "sam"
                          ? "Sam"
                          : agent === "jess"
                            ? "Jess"
                            : agent === "kai"
                              ? "Kai"
                              : agent === "priya"
                                ? "Priya"
                                : "Mike"}
                      </span>
                    </motion.div>
                  );
                })()}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline"
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
                              onClick={(e) => { e.preventDefault(); navigate(href); }}
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
              </div>
              </div>
              );
            })}

            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2.5 justify-start">
                <MechanicAvatar size={36} className="mt-0.5" />
                <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Intent quick-action buttons — show only on welcome */}
          {messages.length === 1 && messages[0]?.role === "assistant" && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => send("I have an issue with my vehicle")}
                className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                🔧 I have an issue
              </button>
              <button
                type="button"
                onClick={() => send("I want to prevent problems and keep my car in good shape")}
                className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                🛡️ Prevent problems
              </button>
            </div>
          )}

          {/* Quick prompts — show after first exchange */}
          {messages.length > 1 && messages.length <= 4 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (chip.includes("photo")) fileInputRef.current?.click();
                    else if (chip.includes("VIN")) setVinModalOpen(true);
                    else send(chip);
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

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

          {/* Tools row */}
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
            <button type="button" onClick={() => setVinModalOpen(true)} disabled={loading}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40" aria-label="Scan VIN">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><ScanLine className="h-4 w-4" /></span>
              <span className="text-[11px] leading-none font-medium whitespace-nowrap">Scan VIN</span>
            </button>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <span className="flex h-9 w-9 items-center justify-center">
                <AudioRecordButton
                  disabled={loading || uploading}
                  onAnalysis={(analysis) => {
                    const userMsg: Msg = { role: "user", content: "🔊 [Recorded a car noise clip for analysis]" };
                    const assistantMsg: Msg = { role: "assistant", content: analysis };
                    setMessages((prev) => [...prev, userMsg, assistantMsg]);
                  }}
                />
              </span>
              <span className="text-[11px] leading-none font-medium whitespace-nowrap">Record Sound</span>
            </div>
          </div>

          {/* Primary input: Type or Talk */}
          <div className="border-t border-border px-3 py-2.5">
            {voiceEnabled ? (
              /* ── Voice mode active ── */
              <div className="flex items-center gap-2">
                {isListening && <AudioWaveform />}
                <button
                  type="button"
                  onClick={async () => {
                    if (isListening) {
                      stopListening(VOICE_OWNER);
                    } else {
                      await unlockAudioPlayback();
                      const started = startListening(VOICE_OWNER);
                      if (!started) {
                        toast.error("Couldn't start listening. Check mic permission and try again.");
                      }
                    }
                  }}
                  disabled={loading || isSpeaking || (isListening && voiceOwner !== VOICE_OWNER)}
                  className={`relative flex h-11 flex-1 items-center justify-center gap-2 rounded-xl font-medium text-sm transition-all disabled:opacity-40 ${
                    isListening
                      ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/30"
                      : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                  }`}
                  aria-label={isListening ? "Stop listening" : "Tap to speak"}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      <span>Tap to stop</span>
                      <span className="absolute top-1 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive-foreground" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>Tap to speak</span>
                    </>
                  )}
                </button>
                {/* Switch to type */}
                <button
                  type="button"
                  onClick={() => { stopListening(VOICE_OWNER); stopSpeaking(); toggleVoice(); }}
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Switch to typing"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Type</span>
                </button>
              </div>
            ) : (
              /* ── Text mode (default) ── */
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={pendingPhotos.length > 0 ? "Describe the damage (optional)…" : "Tell me what's going on…"}
                  maxLength={8000}
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  disabled={loading}
                />
                <button type="submit" disabled={loading || (!input.trim() && pendingPhotos.length === 0)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
                {/* Switch to talk */}
                {(supportsSTT || supportsTTS) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const unlocked = await unlockAudioPlayback();
                      if (!unlocked) {
                        toast.warning("Speaker audio may stay muted — but voice mode is on.");
                      }
                      toggleVoice();
                      toast.success("🎙️ Voice mode on — I'll speak my responses!", { duration: 3000 });
                      if (supportsSTT) {
                        setTimeout(() => {
                          const started = startListening(VOICE_OWNER);
                          if (!started) {
                            toast.error("Microphone access is blocked. Allow mic permission and try again.");
                          }
                        }, 0);
                      }
                    }}
                    disabled={loading}
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                    aria-label="Switch to voice mode"
                  >
                    <Mic className="h-4 w-4" />
                    <span className="hidden sm:inline">Talk</span>
                  </button>
                )}
              </form>
            )}
            {/* Transcript preview in voice mode with text input for editing */}
            {voiceEnabled && input && !isListening && (
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 mt-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Edit before sending…"
                  maxLength={8000}
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* VIN Scan/Entry Modal */}
      <Dialog open={vinModalOpen} onOpenChange={setVinModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading">Identify Your Vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your 17-character VIN to instantly identify your vehicle.</p>

          <div className="space-y-3 mt-2">
            {/* Manual VIN entry */}
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
    </section>
  );
}
