import { supabase } from "@/integrations/supabase/client";
import {
  extractVideoFrames,
  isVideoFile,
  MAX_VIDEO_SIZE,
} from "@/lib/videoFrameExtractor";
import { extractVideoAudio } from "@/lib/videoAudioExtractor";

export interface VideoAnalysisResult {
  /** The assessment text from the analysis service. */
  analysis: string;
  /** Whether the service detected usable audio (authoritative server-side check). */
  hasAudio: boolean;
  frameCount: number;
}

/**
 * Wire a validated capture into the existing chat video pipeline.
 *
 * Same path ChatBot/InlineChatWidget use — no new storage buckets:
 *  1. Extract frames client-side (extractVideoFrames).
 *  2. Upload frames to the existing `damage-photos` bucket, get signed URLs.
 *  3. Extract the audio track client-side (extractVideoAudio → WAV).
 *  4. POST frame_urls + audio to the `analyze-video-combined` edge function.
 *
 * Errors are plain-language. Callers should keep the original capture so a
 * failed analysis can offer "Try again" without a new recording.
 */
export async function uploadVideoForAnalysis(
  file: File | Blob,
  opts?: { vehicleContext?: string; frameCount?: number },
): Promise<VideoAnalysisResult> {
  const videoFile =
    file instanceof File ? file : new File([file], `wrenchli-capture-${Date.now()}.webm`, { type: file.type || "video/webm" });

  if (!isVideoFile(videoFile)) {
    throw new Error("That doesn't look like a video file.");
  }
  if (videoFile.size > MAX_VIDEO_SIZE) {
    throw new Error("That video is over 50MB, which is too big to send.");
  }

  const frameCount = Math.min(Math.max(opts?.frameCount ?? 4, 1), 8);
  const [frames, audioBlob] = await Promise.all([
    extractVideoFrames(videoFile, frameCount),
    extractVideoAudio(videoFile),
  ]);

  if (frames.length === 0) {
    throw new Error("We couldn't pull any clear frames from that video. Please record again.");
  }

  const uploadedUrls: string[] = [];
  for (const frame of frames) {
    const path = `video-frames/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("damage-photos")
      .upload(path, frame, { contentType: "image/jpeg" });
    if (error) {
      console.error("[video upload] frame upload failed:", error);
      throw new Error("The upload was interrupted. Your recording is kept — please try again.");
    }
    const { data: urlData, error: signErr } = await supabase.storage
      .from("damage-photos")
      .createSignedUrl(path, 3600);
    if (signErr || !urlData?.signedUrl) {
      console.error("[video upload] signed URL failed:", signErr);
      throw new Error("The upload was interrupted. Your recording is kept — please try again.");
    }
    uploadedUrls.push(urlData.signedUrl);
  }

  const formData = new FormData();
  formData.append("frame_urls", JSON.stringify(uploadedUrls));
  const vehicleContext =
    opts?.vehicleContext ?? sessionStorage.getItem("wrenchli_vehicle") ?? "";
  if (vehicleContext) formData.append("vehicle_context", vehicleContext);
  if (audioBlob) {
    formData.append("audio", new File([audioBlob], "video-audio.wav", { type: "audio/wav" }));
  }

  const analyzeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video-combined`;
  const signal =
    typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(150_000) : undefined;

  let response: Response;
  try {
    response = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
      signal,
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError") {
      throw new Error("The analysis took too long and timed out. Your recording is kept — please try again.");
    }
    throw new Error("The upload was interrupted (network). Your recording is kept — please try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.analysis) {
    const raw = (data && (data.detail || data.error)) || "";
    if (/HTTP 5\d\d|gemini_unavailable/i.test(raw) || response.status >= 500) {
      throw new Error("The analysis service returned an error. Your recording is kept — please try again in a moment.");
    }
    if (response.status >= 400 && response.status < 500) {
      throw new Error("The server rejected the request. Your recording is kept — please try again.");
    }
    throw new Error("Video analysis didn't go through. Your recording is kept — please try again.");
  }

  return {
    analysis: data.analysis as string,
    hasAudio: Boolean(data.has_audio),
    frameCount: Number(data.frame_count) || uploadedUrls.length,
  };
}
