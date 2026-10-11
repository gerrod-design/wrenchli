import { useEffect, useRef, useState } from "react";
import {
  Video as VideoIcon,
  Square,
  RotateCcw,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shouldUseNativeCapture } from "@/lib/videoCapture";
import {
  validateVideoFile,
  blobToVideoFile,
  type VideoValidationResult,
} from "@/lib/videoValidation";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";

export type VideoCaptureMode = "symptom" | "repair-complete";

interface VideoCaptureProps {
  mode: VideoCaptureMode;
  /** Fires only AFTER the clip passes broken-recording validation. */
  onCaptured: (file: File | Blob) => void;
  onError?: (reason: string) => void;
  className?: string;
}

type Phase = "ready" | "recording" | "preview" | "error";

const COPY: Record<
  VideoCaptureMode,
  { title: string; body: string; recordLabel: string }
> = {
  symptom: {
    title: "Record the noise",
    body: "Film what's happening — picture and sound together, for at least 3 seconds. Get close to where the sound comes from.",
    recordLabel: "Record video",
  },
  "repair-complete": {
    title: "Film the finished repair",
    body: "Show the completed work — picture and sound together, for at least 3 seconds. This is what verifies the job.",
    recordLabel: "Film repair",
  },
};

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Video capture with broken-recording rejection.
 *
 * Two strategies:
 *  - iOS / no-MediaRecorder environments → native camera picker
 *    (<input type="file" accept="video/*" capture="environment">). The
 *    native camera app is the reliable viewfinder on iPhone and its OS
 *    retake flow replaces anything we could build in-page.
 *  - Desktop / Android with MediaRecorder → in-browser recorder with a
 *    live viewfinder, playback preview, and an explicit Retake button.
 *
 * onCaptured fires ONLY after validation passes (duration ≥ 3s, sane file
 * size, audio present where detectable). Every failure is plain-language
 * and always offers a retake — no jargon, no dead ends.
 */
export default function VideoCapture({
  mode,
  onCaptured,
  onError,
  className,
}: VideoCaptureProps) {
  const [useNative] = useState(() => shouldUseNativeCapture());
  const [phase, setPhase] = useState<Phase>("ready");
  const [validating, setValidating] = useState(false);
  const [failure, setFailure] = useState<VideoValidationResult & { ok: false } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewfinderRef = useRef<HTMLVideoElement>(null);
  const copy = COPY[mode];

  const recorder = useVideoRecorder();

  // Attach the live stream to the viewfinder.
  useEffect(() => {
    const el = viewfinderRef.current;
    if (el && recorder.stream) {
      el.srcObject = recorder.stream;
      el.play().catch(() => {});
    }
  }, [recorder.stream]);

  useEffect(() => {
    if (recorder.status === "recording") setPhase("recording");
    else if (recorder.status === "recorded") setPhase("preview");
    else if (recorder.status === "error" && recorder.error) {
      setPhase("error");
      setFailure(null);
      onError?.(recorder.error);
    } else if (recorder.status === "idle") {
      setPhase((p) => (p === "recording" || p === "preview" ? "ready" : p));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  const fail = (result: VideoValidationResult & { ok: false }) => {
    setFailure(result);
    setPhase("error");
    onError?.(result.message);
  };

  const handleNativeFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setValidating(true);
    setFailure(null);
    const result = await validateVideoFile(file);
    setValidating(false);
    if (result.ok) {
      onCaptured(file);
      setPhase("ready");
    } else {
      fail(result);
    }
  };

  const handleUseRecording = async () => {
    if (!recorder.recordedBlob) return;
    setValidating(true);
    setFailure(null);
    const file = blobToVideoFile(recorder.recordedBlob, recorder.recordedMimeType);
    const result = await validateVideoFile(file);
    setValidating(false);
    if (result.ok) {
      onCaptured(file);
      recorder.retake();
    } else {
      fail(result);
    }
  };

  const openNativePicker = () => {
    setFailure(null);
    setPhase("ready");
    fileInputRef.current?.click();
  };

  const renderError = (message: string, retakeLabel: string, onRetake: () => void) => (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-foreground">{message}</p>
      <Button onClick={onRetake} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        {retakeLabel}
      </Button>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {useNative ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{copy.title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{copy.body}</p>
          </div>

          {phase === "error" && failure ? (
            renderError(failure.message, "Record again", openNativePicker)
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                aria-label={copy.title}
                onChange={(e) => {
                  void handleNativeFile(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                size="lg"
                className="h-20 w-20 rounded-full p-0"
                aria-label={copy.recordLabel}
                disabled={validating}
                onClick={openNativePicker}
              >
                {validating ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <VideoIcon className="h-8 w-8" />
                )}
              </Button>
              <p className="text-sm font-medium">
                {validating ? "Checking your video…" : copy.recordLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                Opens your camera — you can retake there before confirming.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{copy.title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{copy.body}</p>
          </div>

          {phase === "error" && failure ? (
            renderError(failure.message, "Retake video", () => {
              setFailure(null);
              recorder.retake();
            })
          ) : phase === "error" && recorder.error ? (
            renderError(recorder.error, "Try again", () => recorder.retake())
          ) : phase === "preview" && recorder.previewUrl ? (
            <div className="flex w-full flex-col items-center gap-4">
              <video
                src={recorder.previewUrl}
                controls
                playsInline
                className="aspect-video w-full max-w-md rounded-2xl bg-black"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => recorder.retake()} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>
                <Button
                  onClick={() => void handleUseRecording()}
                  disabled={validating}
                  className="gap-2"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {validating ? "Checking…" : "Use this video"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-4">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-black">
                {recorder.stream ? (
                  <video
                    ref={viewfinderRef}
                    muted
                    playsInline
                    className="aspect-video w-full -scale-x-100 object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-muted">
                    <VideoIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {phase === "recording" && (
                  <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                    {formatElapsed(recorder.durationSec)}
                  </span>
                )}
              </div>

              {phase === "recording" ? (
                <Button size="lg" variant="destructive" onClick={() => recorder.stop()} className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => void recorder.start()}
                  disabled={recorder.status === "requesting"}
                  className="gap-2"
                >
                  {recorder.status === "requesting" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <VideoIcon className="h-5 w-5" />
                  )}
                  {recorder.status === "requesting" ? "Starting camera…" : copy.recordLabel}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Records picture and sound together, right here in your browser.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
