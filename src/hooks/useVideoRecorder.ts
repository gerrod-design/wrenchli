import { useState, useRef, useCallback, useEffect } from "react";
import { pickVideoMimeType } from "@/lib/videoCapture";
import { MAX_RECORD_SECONDS } from "@/lib/videoValidation";

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";

export interface VideoRecorderControls {
  status: RecorderStatus;
  /** Live camera stream for the viewfinder. Null when not recording. */
  stream: MediaStream | null;
  /** Object URL of the finished clip for playback preview. */
  previewUrl: string | null;
  recordedBlob: Blob | null;
  recordedMimeType: string;
  durationSec: number;
  /** Plain-language error for the UI. Always paired with a retake path. */
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  retake: () => void;
}

/**
 * In-browser camera+mic recorder (desktop / Android path).
 * iOS never reaches this hook — it uses the native camera picker instead.
 */
export function useVideoRecorder(): VideoRecorderControls {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>("");
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const autoStopRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    recorderRef.current = null;
  }, []);

  // Never leave the camera on after unmount.
  useEffect(() => {
    return () => {
      cleanup();
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [cleanup]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // onstop finalizes the blob
    } else {
      cleanup();
      setStatus((s) => (s === "recording" ? "idle" : s));
    }
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setRecordedBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDurationSec(0);
    chunksRef.current = [];
    setStatus("requesting");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);

      const mimeType = pickVideoMimeType();
      const recorder = new MediaRecorder(
        mediaStream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;
      setRecordedMimeType(mimeType || recorder.mimeType || "");

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setStatus("recorded");
        cleanup();
      };
      recorder.onerror = () => {
        cleanup();
        setStatus("error");
        setError(
          "The recording was interrupted. Please try again — your camera is fine, this was on our side.",
        );
      };

      startedAtRef.current = Date.now();
      recorder.start(250);
      setStatus("recording");
      timerRef.current = window.setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
      // Cap clip length so uploads stay well under the 50MB limit.
      autoStopRef.current = window.setTimeout(() => stop(), MAX_RECORD_SECONDS * 1000);
    } catch (err) {
      cleanup();
      setStatus("error");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "We can't reach your camera or microphone — permission was blocked. Allow camera and microphone access in your browser, then try again.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError(
          "We couldn't find a camera on this device. You can still record with your phone and upload the video.",
        );
      } else {
        setError(
          "Something went wrong starting the camera. Please check your camera isn't in use elsewhere, then try again.",
        );
      }
    }
  }, [cleanup, stop]);

  const retake = useCallback(() => {
    cleanup();
    setError(null);
    setRecordedBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDurationSec(0);
    chunksRef.current = [];
    setStatus("idle");
  }, [cleanup]);

  return {
    status,
    stream,
    previewUrl,
    recordedBlob,
    recordedMimeType,
    durationSec,
    error,
    start,
    stop,
    retake,
  };
}
