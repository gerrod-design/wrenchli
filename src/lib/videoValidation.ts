/**
 * Broken-recording rejection for video capture.
 *
 * REQUIREMENT (product): every accepted clip must carry picture AND sound,
 * captured simultaneously. A silent clip is not a "video with no audio" —
 * for a noise complaint it is a failed capture, and for a repair-complete
 * clip it breaks the three-video verification loop. So validation runs
 * BEFORE onCaptured fires, and every rejection speaks plain language and
 * offers a retake — never jargon, never a dead end.
 *
 * What is enforced vs best-effort:
 *  - ENFORCED: minimum duration (3s, from video metadata), minimum file
 *    size (catches 0-byte / truncated picks), maximum size (50MB, matches
 *    the chat upload path), video MIME type.
 *  - BEST-EFFORT: audio-track detection. Browsers expose
 *    webkitAudioDecodedByteCount (WebKit) and mozHasAudio (old Firefox);
 *    most browsers expose nothing. When detection is impossible we fall
 *    back to duration + size heuristics and mark audio "unknown" — the
 *    server-side analysis pipeline (extractVideoAudio → analyze-video-
 *    combined) re-checks audio authoritatively and its prompt tells the
 *    customer plainly when the audio was silence/wind.
 */

export const MIN_VIDEO_DURATION_SEC = 3;
export const MIN_VIDEO_SIZE_BYTES = 50 * 1024; // 50KB — below this a clip is truncated/empty
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — matches the chat upload path
export const MAX_RECORD_SECONDS = 60; // in-browser recorder auto-stops here

export type VideoRejectionReason =
  | "not-video"
  | "too-small"
  | "too-large"
  | "too-short"
  | "no-audio"
  | "unreadable";

export type AudioStatus = "detected" | "absent" | "unknown";

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  audio: AudioStatus;
}

export type VideoValidationResult =
  | { ok: true; metadata: VideoMetadata }
  | { ok: false; reason: VideoRejectionReason; message: string };

/** Plain-language rejection copy. No jargon, and the UI always pairs these with a Retake action. */
export const REJECTION_MESSAGES: Record<VideoRejectionReason, string> = {
  "not-video":
    "That doesn't look like a video file. Please record a video — picture and sound together.",
  "too-small":
    "That file looks empty or damaged, so we can't use it. Please record again.",
  "too-large":
    "That video is over 50MB, which is too big to send. Please record a shorter clip and try again.",
  "too-short":
    "That clip was under 3 seconds — too short to assess. Please record a longer clip, with picture and sound together.",
  "no-audio":
    "We couldn't hear any sound in that clip, and the sound is half the story. Please record again with your microphone on and nothing covering it.",
  "unreadable":
    "We couldn't open that video — the format may not be supported. Please try recording again.",
};

interface VideoElementWithAudioProps extends HTMLVideoElement {
  webkitAudioDecodedByteCount?: number;
  mozHasAudio?: boolean;
  audioTracks?: { length: number };
}

/**
 * Best-effort audio-track detection. Returns null when the browser exposes
 * no audio signal at all (the common case) — callers must NOT treat null
 * as "no audio"; see module docstring.
 */
export function detectAudioTrack(video: HTMLVideoElement): AudioStatus {
  const v = video as VideoElementWithAudioProps;
  if (typeof v.webkitAudioDecodedByteCount === "number") {
    return v.webkitAudioDecodedByteCount > 0 ? "detected" : "absent";
  }
  if (typeof v.mozHasAudio === "boolean") {
    return v.mozHasAudio ? "detected" : "absent";
  }
  if (v.audioTracks && typeof v.audioTracks.length === "number") {
    return v.audioTracks.length > 0 ? "detected" : "absent";
  }
  return "unknown";
}

export interface VideoElementFactory {
  create(): HTMLVideoElement;
  objectUrlFor(file: File | Blob): string;
  revokeObjectUrl(url: string): void;
}

const domFactory: VideoElementFactory = {
  create: () => document.createElement("video"),
  objectUrlFor: (file) => URL.createObjectURL(file),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
};

/** Load metadata (duration, dimensions, audio signal) without playing the clip. */
export function getVideoMetadata(
  file: File | Blob,
  factory: VideoElementFactory = domFactory,
  timeoutMs = 15_000,
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = factory.create();
    video.preload = "metadata";
    video.muted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (video as any).playsInline = true;

    const url = factory.objectUrlFor(file);
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      factory.revokeObjectUrl(url);
      fn();
    };

    const timer = setTimeout(() => {
      done(() => reject(new Error("unreadable")));
    }, timeoutMs);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      done(() =>
        resolve({
          durationSec: Number.isFinite(video.duration) ? video.duration : 0,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          audio: detectAudioTrack(video),
        }),
      );
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(() => reject(new Error("unreadable")));
    };
    video.src = url;
  });
}

/** Pure validation over a file + its metadata. Fully unit-testable. */
export function validateVideoMetadata(
  file: File | Blob,
  metadata: VideoMetadata,
): VideoValidationResult {
  const type = file.type || "";
  if (type && !type.startsWith("video/")) {
    return { ok: false, reason: "not-video", message: REJECTION_MESSAGES["not-video"] };
  }
  if (file.size < MIN_VIDEO_SIZE_BYTES) {
    return { ok: false, reason: "too-small", message: REJECTION_MESSAGES["too-small"] };
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { ok: false, reason: "too-large", message: REJECTION_MESSAGES["too-large"] };
  }
  if (!Number.isFinite(metadata.durationSec) || metadata.durationSec < MIN_VIDEO_DURATION_SEC) {
    return { ok: false, reason: "too-short", message: REJECTION_MESSAGES["too-short"] };
  }
  // Enforce audio only when the browser could actually tell. "unknown" passes
  // here and is re-checked server-side by the analysis pipeline.
  if (metadata.audio === "absent") {
    return { ok: false, reason: "no-audio", message: REJECTION_MESSAGES["no-audio"] };
  }
  return { ok: true, metadata };
}

/** Full pipeline: metadata load → validation. Rejects with a validation result, never throws. */
export async function validateVideoFile(
  file: File | Blob,
  factory?: VideoElementFactory,
): Promise<VideoValidationResult> {
  const type = file.type || "";
  if (type && !type.startsWith("video/")) {
    return { ok: false, reason: "not-video", message: REJECTION_MESSAGES["not-video"] };
  }
  if (file.size < MIN_VIDEO_SIZE_BYTES) {
    return { ok: false, reason: "too-small", message: REJECTION_MESSAGES["too-small"] };
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { ok: false, reason: "too-large", message: REJECTION_MESSAGES["too-large"] };
  }
  try {
    const metadata = await getVideoMetadata(file, factory);
    return validateVideoMetadata(file, metadata);
  } catch {
    return { ok: false, reason: "unreadable", message: REJECTION_MESSAGES["unreadable"] };
  }
}

/** Coerce a recorded Blob into a File with a sensible name/extension for upload. */
export function blobToVideoFile(blob: Blob, mimeType: string): File {
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const type = blob.type || mimeType || `video/${ext}`;
  return new File([blob], `wrenchli-capture-${Date.now()}.${ext}`, { type });
}
