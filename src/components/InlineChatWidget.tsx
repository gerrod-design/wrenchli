import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ImagePlus, Camera, ScanLine, Keyboard, Mic, MicOff } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const vinCameraRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleListening = useCallback(() => {
    if (!speechSupported) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow mic access in your browser settings.");
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, speechSupported]);

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
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (() => {
                  const agent = detectAgent(m.content);
                  return (
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <MechanicAvatar size={36} className="mt-0.5" agent={agent} />
                      <span className="text-[10px] font-medium text-muted-foreground leading-none">
                        {agent === "sam" ? "Sam" : agent === "jess" ? "Jess" : "Mike"}
                      </span>
                    </div>
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
            ))}

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
              {speechSupported && (
                <button type="button" onClick={toggleListening} disabled={loading}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                    isListening
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`} aria-label={isListening ? "Stop listening" : "Voice input"}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening…" : pendingPhotos.length > 0 ? "Describe the damage (optional)…" : "Tell me what's going on…"}
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
