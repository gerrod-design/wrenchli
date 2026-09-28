import { useState, useRef, useEffect, useCallback } from "react";
import { X, Square, RotateCcw, Check, Loader2, Video, AlertTriangle } from "lucide-react";

export const MAX_VIDEO_SECONDS = 15;

type Phase = "coaching" | "recording" | "review" | "error";

interface Props {
  /** Context-aware coaching line, e.g. "Record while you reproduce the sound…" */
  tip: string;
  onClose: () => void;
  /** Hands the recorded clip back to the parent for background upload. */
  onCaptured: (file: File) => void;
}

function pickMimeType(): string | undefined {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) return undefined;
  const candidates = [
    "video/mp4", // Safari's native container
    "video/webm;codecs=vp9",
    "video/webm;codecs=h264",
    "video/webm",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function extensionFor(mime: string | undefined): string {
  if (mime?.includes("mp4")) return "mp4";
  if (mime?.includes("webm")) return "webm";
  return "mp4";
}

const RING_RADIUS = 34;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function VideoCaptureModal({ tip, onClose, onCaptured }: Props) {
  const [phase, setPhase] = useState<Phase>("coaching");
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingMs, setRemainingMs] = useState(MAX_VIDEO_SECONDS * 1000);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef<number>(0);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Full cleanup on unmount: never leave the camera running.
  useEffect(() => {
    return () => {
      clearTimer();
      try {
        recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
      } catch {
        /* already stopped */
      }
      stopTracks();
      if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failToNative = useCallback((message: string) => {
    clearTimer();
    stopTracks();
    setErrorMsg(message);
    setPhase("error");
  }, [clearTimer, stopTracks]);

  const startRecording = useCallback(async () => {
    const mime = pickMimeType();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      failToNative("This browser can't record video in-page.");
      return;
    }
    mimeRef.current = mime;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Audio matters: grinding, squealing, and knocking are the symptom.
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => {});
      }
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearTimer();
        const blob = new Blob(chunksRef.current, { type: mimeRef.current || "video/mp4" });
        const url = URL.createObjectURL(blob);
        setReviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        stopTracks();
        setPhase("review");
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setPhase("recording");

      // Visible countdown: auto-stop at the cap so every clip is usable.
      deadlineRef.current = Date.now() + MAX_VIDEO_SECONDS * 1000;
      setRemainingMs(MAX_VIDEO_SECONDS * 1000);
      timerRef.current = window.setInterval(() => {
        const left = deadlineRef.current - Date.now();
        if (left <= 0) {
          try {
            recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
          } catch {
            /* ignore */
          }
        } else {
          setRemainingMs(left);
        }
      }, 100);
    } catch (e: any) {
      const name = e?.name || "";
      failToNative(
        name === "NotAllowedError"
          ? "Camera access was blocked. You can allow it in your browser settings, or use your phone's camera instead."
          : "Couldn't start the camera. Your phone's camera app works too."
      );
    }
  }, [failToNative, clearTimer, stopTracks]);

  const stopNow = useCallback(() => {
    try {
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const retake = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
    setPhase("coaching");
  }, [reviewUrl]);

  const useVideo = useCallback(() => {
    if (!reviewUrl) return;
    // Rebuild a File from the recorded chunks so the parent can upload it.
    const blob = new Blob(chunksRef.current, { type: mimeRef.current || "video/mp4" });
    const ext = extensionFor(mimeRef.current);
    const file = new File([blob], `symptom-clip-${Date.now()}.${ext}`, { type: blob.type });
    onCaptured(file);
    onClose();
  }, [reviewUrl, onCaptured, onClose]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  const ringProgress = remainingMs / (MAX_VIDEO_SECONDS * 1000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Record a video of the problem"
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "#0F1117", border: "1px solid #2A2D37" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #2A2D37" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#F5F5F5" }}>
            <Video className="h-4 w-4" style={{ color: "#E07B39" }} />
            {phase === "recording" ? "Recording…" : phase === "review" ? "Review your clip" : "Record a video"}
          </div>
          <button
            type="button"
            aria-label="Close video recorder"
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: "#9CA3AF" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* COACHING — the 15 seconds only work if the consumer knows what to point at */}
        {phase === "coaching" && (
          <div className="p-5 space-y-4">
            <div className="rounded-lg p-4" style={{ background: "#E07B3920", border: "1px solid #E07B3940" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#E07B39" }}>HOW TO MAKE THESE 15 SECONDS COUNT</p>
              <p className="text-sm" style={{ color: "#F5F5F5" }}>{tip}</p>
            </div>
            <ul className="text-xs space-y-1.5" style={{ color: "#9CA3AF" }}>
              <li>• Hold the phone steady — brace it against the car if you can.</li>
              <li>• Get close enough to see detail, but keep the area in frame.</li>
              <li>• The clip stops automatically after {MAX_VIDEO_SECONDS} seconds.</li>
            </ul>
            <button
              type="button"
              onClick={startRecording}
              className="w-full py-3 rounded-lg text-sm font-semibold"
              style={{ background: "#E07B39", color: "#0F1117" }}
            >
              Start recording
            </button>
          </div>
        )}

        {/* RECORDING — live preview, big countdown, progress ring */}
        {phase === "recording" && (
          <div className="p-4 space-y-3">
            <div className="relative rounded-lg overflow-hidden" style={{ background: "#000" }}>
              <video
                ref={previewRef}
                playsInline
                muted
                autoPlay
                className="w-full aspect-video object-cover"
              />
              {/* countdown overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(0,0,0,0.65)" }}>
                <svg width="44" height="44" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r={RING_RADIUS} fill="none" stroke="#2A2D37" strokeWidth="7" />
                  <circle
                    cx="40" cy="40" r={RING_RADIUS} fill="none"
                    stroke="#E07B39" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={RING_CIRC * (1 - ringProgress)}
                    transform="rotate(-90 40 40)"
                  />
                  <text x="40" y="48" textAnchor="middle" fill="#F5F5F5" fontSize="24" fontWeight="700">
                    {remainingSec}
                  </text>
                </svg>
                <span className="text-xs font-medium pr-1" style={{ color: "#F5F5F5" }}>sec left</span>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs" style={{ background: "rgba(0,0,0,0.65)", color: "#F5F5F5" }}>
                Hold steady…
              </div>
            </div>
            <button
              type="button"
              onClick={stopNow}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
              style={{ background: "#0F1117", border: "1px solid #E07B3940", color: "#E07B39" }}
            >
              <Square className="h-4 w-4" /> Stop early
            </button>
          </div>
        )}

        {/* REVIEW — watch it back, retake or keep */}
        {phase === "review" && reviewUrl && (
          <div className="p-4 space-y-3">
            <video src={reviewUrl} controls playsInline className="w-full aspect-video rounded-lg" style={{ background: "#000" }} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium"
                style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
              >
                <RotateCcw className="h-4 w-4" /> Retake
              </button>
              <button
                type="button"
                onClick={useVideo}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold"
                style={{ background: "#E07B39", color: "#0F1117" }}
              >
                <Check className="h-4 w-4" /> Use this clip
              </button>
            </div>
          </div>
        )}

        {/* ERROR — graceful fallback to the native camera */}
        {phase === "error" && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
              <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#F59E0B" }} />
              <p className="text-sm" style={{ color: "#9CA3AF" }}>{errorMsg}</p>
            </div>
            <input
              ref={nativeInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onCaptured(f);
                  onClose();
                }
              }}
            />
            <button
              type="button"
              onClick={() => nativeInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
              style={{ background: "#E07B39", color: "#0F1117" }}
            >
              <Video className="h-4 w-4" /> Record with my camera app
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-xs font-medium"
              style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
            >
              Skip video
            </button>
          </div>
        )}

        {phase === "coaching" && (
          <div className="px-5 pb-4 flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <Loader2 className="h-3 w-3 invisible" />
            Nothing uploads until you tap “Use this clip”.
          </div>
        )}
      </div>
    </div>
  );
}
