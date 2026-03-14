import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, ImagePlus, Camera, Copy, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type Msg = { role: "user" | "assistant"; content: string; image_urls?: string[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  console.log("[ChatBot] Chat response status:", resp.status);

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error("[ChatBot] Chat error response:", data);
    onError(data.error || "Something went wrong. Please try again.");
    return;
  }

  if (!resp.body) {
    onError("No response received.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content as string | undefined;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported.");
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return null;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("damage-photos")
      .upload(path, file, { contentType: file.type });

    if (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo.");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("damage-photos")
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 5 - pendingPhotos.length;
    if (remaining <= 0) {
      toast.error("Maximum 5 photos per message.");
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      const url = await uploadPhoto(file);
      if (url) uploaded.push(url);
    }

    if (uploaded.length > 0) {
      setPendingPhotos((prev) => [...prev, ...uploaded]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if ((!text && pendingPhotos.length === 0) || loading) return;
    setInput("");

    const userMsg: Msg = {
      role: "user",
      content: text || "Please analyze this vehicle damage.",
      ...(pendingPhotos.length > 0 ? { image_urls: [...pendingPhotos] } : {}),
    };
    console.log("[ChatBot] Sending message:", { content: userMsg.content, image_urls: userMsg.image_urls });
    setPendingPhotos([]);
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setLoading(false),
        onError: (msg) => {
          upsert(msg);
          setLoading(false);
        },
      });
    } catch {
      upsert("Sorry, something went wrong. Please try again.");
      setLoading(false);
    }
  }, [input, loading, messages, pendingPhotos]);

  const SUGGESTION_CHIPS = [
    "Check engine light",
    "Strange noise",
    "What's my car worth?",
    "📸 Diagnose damage from a photo",
  ];

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity md:bottom-8"
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:bottom-8 md:right-6"
            style={{ height: "min(520px, calc(100vh - 10rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-3">
              <span className="font-semibold text-primary-foreground text-sm">
                Wrenchli Assistant
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 relative transition-colors ${
                isDragOver ? "bg-accent/10" : ""
              }`}
            >
              {/* Drag overlay */}
              {isDragOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent rounded-lg">
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto text-accent mb-2" />
                    <p className="text-sm font-medium text-accent">Drop photos here</p>
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-muted-foreground text-sm text-center">
                    🔧 Describe your car issue, a warning light, or a DTC code — or drop a photo of damage for instant AI analysis.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (chip.includes("photo")) {
                            fileInputRef.current?.click();
                          } else {
                            send(chip);
                          }
                        }}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_a]:text-primary [&_a]:underline [&_a]:font-medium"
                    }`}
                  >
                    {/* User images */}
                    {m.role === "user" && m.image_urls && m.image_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        {m.image_urls.map((url, j) => (
                          <img
                            key={j}
                            src={url}
                            alt={`Attached ${j + 1}`}
                            className="rounded-md w-full h-20 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    {m.role === "user" ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} className="text-primary underline font-medium hover:opacity-80">{children}</a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground animate-pulse">
                      {messages[messages.length - 1]?.image_urls?.length
                        ? "Analyzing damage photos…"
                        : "Thinking…"}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Pending photos preview */}
            {pendingPhotos.length > 0 && (
              <div className="border-t border-border px-3 py-2 flex gap-2 overflow-x-auto">
                {pendingPhotos.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <img src={url} alt={`Pending ${i + 1}`} className="h-12 w-12 rounded-md object-cover border border-border" />
                    <button
                      onClick={() => removePendingPhoto(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploading && (
                  <div className="h-12 w-12 rounded-md border border-dashed border-border flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading || pendingPhotos.length >= 5}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Attach photo"
                  title="Attach damage photo"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading || uploading || pendingPhotos.length >= 5}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                    aria-label="Take photo"
                    title="Take a photo with camera"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={pendingPhotos.length > 0 ? "Describe the damage (optional)…" : "Type a message…"}
                  maxLength={8000}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && pendingPhotos.length === 0)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {input.length > 7600 && (
                <div className="px-3 pb-2 text-xs text-muted-foreground">
                  {8000 - input.length} characters remaining
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
