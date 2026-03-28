import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ImagePlus, Camera, ScanLine, Keyboard, Mic, MicOff, Volume2, VolumeX, Film } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Msg } from "./chatbot/types";
import { streamChat } from "./chatbot/streamChat";
import MechanicAvatar, { type AgentType } from "./MechanicAvatar";
import { sanitizeVin, isValidVin, decodeVin, type DecodedVehicle } from "@/lib/vinDecoder";
import { extractVideoFrames, isVideoFile, MAX_VIDEO_SIZE } from "@/lib/videoFrameExtractor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AudioWaveform from "./chatbot/AudioWaveform";
import { useSharedVoiceChat } from "@/contexts/VoiceChatContext";

const GREETING = "👋 Hey there! I'm Mike, your Wrenchli advisor. Tell me what's going on with your car and I'll help you figure it out.";

/** Detect agent markers like [Agent: Sam] in message content */
function detectAgent(content: string): AgentType {
  if (/\[Agent:\s*Sam\]/i.test(content)) return "sam";
  if (/\[Agent:\s*Jess\]/i.test(content)) return "jess";
  return "mike";
}

/** Strip agent markers from displayed content */
function cleanAgentMarker(content: string): string {
  return content.replace(/\[Agent:\s*(?:Mike|Sam|Jess)\]\s*/gi, "");
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
    startListening, stopListening, speak, stopSpeaking, supportsSTT, supportsTTS, silenceCountdown, voiceOwner,
  } = useSharedVoiceChat();

  // Speak once when a response finishes streaming for the active voice owner.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    const justFinishedStreaming = prevLoadingRef.current && !loading;
    prevLoadingRef.current = loading;

    if (!justFinishedStreaming || !voiceEnabled || voiceOwner !== VOICE_OWNER) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.content.trim()) {
      speak(lastMsg.content, detectAgent(lastMsg.content));
    }
  }, [loading, voiceEnabled, voiceOwner, messages, speak]);

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
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const url = await uploadPhoto(file);
      if (url) uploaded.push(url);
    }
    if (uploaded.length) setPendingPhotos((p) => [...p, ...uploaded]);
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
        onDone: () => setLoading(false),
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
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />

          {/* Chat messages area */}
          <div className="overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: isMobile ? "350px" : "380px", minHeight: "200px" }}>
            {messages.map((m, i) => {
              // Detect agent handoff
              const currentAgent = m.role === "assistant" ? detectAgent(m.content) : null;
              const prevAssistant = messages.slice(0, i).reverse().find(msg => msg.role === "assistant");
              const prevAgent = prevAssistant ? detectAgent(prevAssistant.content) : null;
              const isHandoff = currentAgent && prevAgent && currentAgent !== prevAgent;
              const agentName = currentAgent === "sam" ? "Sam" : currentAgent === "jess" ? "Jess" : "Mike";

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
                  const agent = detectAgent(m.content);
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
                        {agent === "sam" ? "Sam" : agent === "jess" ? "Jess" : "Mike"}
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

          {/* Quick prompts — only show when conversation just started */}
          {messages.length <= 2 && !loading && (
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

          {/* Input bar */}
          <div className="border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 px-3 py-2.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading || pendingPhotos.length >= 5}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40" aria-label="Attach photo">
                <ImagePlus className="h-4 w-4" />
              </button>
              {isMobile && (
                <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading || uploading || pendingPhotos.length >= 5}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40" aria-label="Take photo">
                  <Camera className="h-4 w-4" />
                </button>
              )}
              {/* Voice toggle */}
              {(supportsSTT || supportsTTS) && (
                <button type="button" onClick={() => {
                  const turningOn = !voiceEnabled;
                  toggleVoice();

                  if (turningOn) {
                    toast.success("🎙️ Voice mode on — I'll speak my responses!", { duration: 3000 });
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
                }} disabled={loading}
                  className={`flex h-9 items-center justify-center rounded-lg px-2 transition-colors disabled:opacity-40 ${
                    voiceEnabled
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`} aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}>
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              {/* Mic button (only when voice mode is on) */}
              {voiceEnabled && supportsSTT && (
                <>
                  {isListening && <AudioWaveform />}
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening(VOICE_OWNER);
                      } else {
                        startListening(VOICE_OWNER);
                      }
                    }}
                    disabled={loading || isSpeaking || (isListening && voiceOwner !== VOICE_OWNER)}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                      isListening
                        ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/50 ring-offset-1 ring-offset-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`} aria-label={isListening ? "Stop listening" : "Voice input"}>
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
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening…" : pendingPhotos.length > 0 ? "Describe the damage (optional)…" : voiceEnabled ? "Tap mic or type…" : "Tell me what's going on…"}
                maxLength={8000}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                disabled={loading}
              />
              <button type="submit" disabled={loading || (!input.trim() && pendingPhotos.length === 0)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </form>
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
