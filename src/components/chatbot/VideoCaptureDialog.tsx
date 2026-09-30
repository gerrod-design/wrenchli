import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { X, Square, RotateCcw, Check, Loader2, Video, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickVideoMimeType, videoExtensionForMimeType } from "@/lib/videoCapture";

const MAX_RECORD_SECONDS = 60;

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface VideoCaptureHandle {
  /** Start camera+mic capture. Call synchronously inside the tap gesture so
   *  iOS Safari / Chrome grant the permission prompt. */
  beginCapture: () => void;
}

interface VideoCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the finished clip. The parent feeds it into handleFileUpload. */
  onUseVideo: (file: File) => void;
  /** Fallback when permission is denied: parent opens the file picker. */
  onFallbackToPicker?: () => void;
}

type Phase = "idle" | "starting" | "recording" | "review" | "denied" | "error";

const VideoCaptureDialog = forwardRef<VideoCaptureHandle, VideoCaptureDialogProps>(
  function VideoCaptureDialog({ open, onOpenChange, onUseVideo, onFallbackToPicker }, ref) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [elapsed, setElapsed] = useState(0);
    const [reviewUrl, setReviewUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const reviewBlobRef = useRef<Blob | null>(null);
    const reviewUrlRef = useRef<string | null>(null);
    const mimeTypeRef = useRef("");
    const timerRef = useRef<number | null>(null);
    const autoStopRef = useRef<number | null>(null);
    const startedAtRef = useRef(0);
    const cancelledRef = useRef(false);
    const startInFlightRef = useRef(false);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    const clearTimers = useCallback(() => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoStopRef.current !== null) {
        window.clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    }, []);

    const stopTracks = useCallback(() => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
    }, []);

    const revokeReview = useCallback(() => {
      if (reviewUrlRef.current) {
        URL.revokeObjectURL(reviewUrlRef.current);
        reviewUrlRef.current = null;
      }
      reviewBlobRef.current = null;
      setReviewUrl(null);
    }, []);

    /** Full teardown: never leave the camera/mic light on. */
    const teardown = useCallback(() => {
      cancelledRef.current = true;
      clearTimers();
      try {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.onstop = null;
          recorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
      chunksRef.current = [];
      reviewBlobRef.current = null;
      stopTracks();
      startInFlightRef.current = false;
    }, [clearTimers, stopTracks]);

    const handleCancel = useCallback(() => {
      teardown();
      revokeReview();
      setElapsed(0);
      setPhase("idle");
      onOpenChange(false);
    }, [teardown, revokeReview, onOpenChange]);

    const stopRecording = useCallback(() => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") return;
      clearTimers();
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }, [clearTimers]);

    const beginCapture = useCallback(async () => {
      if (startInFlightRef.current) return;
      startInFlightRef.current = true;
      cancelledRef.current = false;
      revokeReview();
      setErrorMsg("");
      setElapsed(0);
      setPhase("starting");

      try {
        // ONE call, camera + microphone together — simultaneous capture is mandatory.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: true,
        });
        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          startInFlightRef.current = false;
          return;
        }
        streamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          void previewVideoRef.current.play().catch(() => {});
        }

        const mimeType = pickVideoMimeType();
        mimeTypeRef.current = mimeType;
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onerror = () => {
          if (cancelledRef.current) return;
          toast.error("Recording stopped unexpectedly. Your chat is safe — please try again.");
          teardown();
          setPhase("error");
          setErrorMsg("Something interrupted the recording. Nothing was lost — try again.");
        };
        recorder.onstop = () => {
          if (cancelledRef.current) return;
          clearTimers();
          const blob = new Blob(chunksRef.current, {
            type: mimeTypeRef.current || "video/webm",
          });
          chunksRef.current = [];
          stopTracks();
          if (blob.size === 0) {
            toast.error("The recording came out empty. Please try again.");
            setPhase("error");
            setErrorMsg("The recording came out empty. Please try again.");
            return;
          }
          const url = URL.createObjectURL(blob);
          reviewBlobRef.current = blob;
          reviewUrlRef.current = url;
          setReviewUrl(url);
          setPhase("review");
        };
        recorderRef.current = recorder;
        recorder.start(250);

        startedAtRef.current = Date.now();
        setPhase("recording");
        timerRef.current = window.setInterval(() => {
          const s = Math.floor((Date.now() - startedAtRef.current) / 1000);
          setElapsed(Math.min(s, MAX_RECORD_SECONDS));
        }, 500);
        autoStopRef.current = window.setTimeout(() => {
          stopRecording();
          toast.info("Stopped at the 60-second limit.");
        }, MAX_RECORD_SECONDS * 1000);
      } catch (err) {
        startInFlightRef.current = false;
        if (cancelledRef.current) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setPhase("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setPhase("error");
          setErrorMsg("No camera or microphone was found on this device.");
          toast.error("No camera or microphone was found on this device.");
        } else {
          setPhase("error");
          setErrorMsg("Couldn't start the camera. Please try again.");
          toast.error("Couldn't start the camera. Please try again.");
        }
      } finally {
        startInFlightRef.current = false;
      }
    }, [clearTimers, revokeReview, stopTracks, teardown, stopRecording]);

    useImperativeHandle(ref, () => ({ beginCapture }), [beginCapture]);

    // If the dialog was opened without beginCapture (e.g. programmatically),
    // start the flow on open as a fallback.
    useEffect(() => {
      if (open && phase === "idle" && !startInFlightRef.current) {
        void beginCapture();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open ]);

    // Teardown on unmount — never leave the camera light on.
    useEffect(() => {
      return () => {
        teardown();
        if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRetake = useCallback(() => {
      revokeReview();
      setElapsed(0);
      void beginCapture();
    }, [revokeReview, beginCapture]);

    const handleUseVideo = useCallback(() => {
      const blob = reviewBlobRef.current;
      if (!blob) {
        toast.error("Couldn't read the recording. Please try again.");
        return;
      }
      const ext = videoExtensionForMimeType(mimeTypeRef.current);
      const file = new File([blob], `wrenchli-video-${Date.now()}.${ext}`, {
        type: blob.type || "video/webm",
      });
      teardown();
      revokeReview();
      setElapsed(0);
      setPhase("idle");
      onOpenChange(false);
      onUseVideo(file);
    }, [teardown, revokeReview, onOpenChange, onUseVideo]);

    const handleFallbackToPicker = useCallback(() => {
      teardown();
      setPhase("idle");
      onOpenChange(false);
      onFallbackToPicker?.();
    }, [teardown, onOpenChange, onFallbackToPicker]);

    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) handleCancel();
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base font-heading flex items-center gap-2">
              <Video className="h-4 w-4" />
              Record video
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4">
            {phase === "starting" && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Starting camera…</p>
              </div>
            )}

            {phase === "recording" && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={previewVideoRef}
                    muted
                    playsInline
                    autoPlay
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {formatElapsed(elapsed)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Show the problem and describe what you hear — picture and sound record together.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 rounded-xl bg-destructive px-3 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    Stop
                  </button>
                </div>
              </div>
            )}

            {phase === "review" && reviewUrl && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    src={reviewUrl}
                    controls
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Play it back — check you can see the problem and hear the sound.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleUseVideo}
                    className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Use video
                  </button>
                </div>
              </div>
            )}

            {phase === "denied" && (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <X className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Camera & microphone are blocked</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  To record video, allow camera and microphone access for this site in your
                  browser settings, then try again.
                </p>
                <div className="flex gap-2 mt-2 w-full">
                  <button
                    type="button"
                    onClick={handleFallbackToPicker}
                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose a video file instead
                  </button>
                  <button
                    type="button"
                    onClick={() => void beginCapture()}
                    className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <X className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Recording didn't work</p>
                <p className="text-sm text-muted-foreground max-w-xs">{errorMsg}</p>
                <div className="flex gap-2 mt-2 w-full">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void beginCapture()}
                    className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default VideoCaptureDialog;
