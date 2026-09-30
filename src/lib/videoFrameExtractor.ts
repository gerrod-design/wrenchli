/**
 * Extract key frames from a video file using the browser's
 * <video> + <canvas> APIs. Returns frames as JPEG File objects.
 */

const MAX_FRAMES = 4;
const FRAME_WIDTH = 1280; // max dimension to keep file sizes small

export interface ExtractionProgress {
  current: number;
  total: number;
}

/**
 * Load a video element from a File and wait for metadata.
 */
function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video. Format may not be supported."));
    };

    // Timeout after 15s
    setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Video loading timed out."));
    }, 15_000);
  });
}

/**
 * Seek the video to a specific time and wait for the frame to render.
 * Never hangs: resolves after SEEK_TIMEOUT_MS even if the browser never
 * fires "seeked" (happens with malformed duration metadata).
 */
const SEEK_TIMEOUT_MS = 4000;

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", onSeeked);
      // Small delay to ensure frame is painted
      requestAnimationFrame(() => resolve());
    };
    const onSeeked = () => finish();
    const timer = window.setTimeout(() => {
      window.clearTimeout(timer);
      finish();
    }, SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked);
    try {
      video.currentTime = time;
    } catch {
      finish();
    }
  });
}

/**
 * Capture the current video frame as a JPEG File.
 */
function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  index: number,
): Promise<File> {
  // Scale down if needed while preserving aspect ratio
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (w > FRAME_WIDTH) {
    const scale = FRAME_WIDTH / w;
    w = FRAME_WIDTH;
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to capture frame"));
        const file = new File([blob], `video-frame-${index + 1}.jpg`, {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      0.85,
    );
  });
}

/**
 * Extract evenly-spaced key frames from a video file.
 *
 * @param file        The video File
 * @param numFrames   How many frames to extract (default 4, max 4)
 * @param onProgress  Optional callback for progress updates
 * @param fallbackDurationSec Optional known recording length (seconds), used
 *   when the file's own duration metadata is missing or broken — iOS Safari's
 *   MediaRecorder is known to write unreliable duration metadata.
 * @returns           Array of JPEG File objects
 */
export async function extractVideoFrames(
  file: File,
  numFrames = MAX_FRAMES,
  onProgress?: (p: ExtractionProgress) => void,
  fallbackDurationSec?: number,
): Promise<File[]> {
  const count = Math.min(numFrames, MAX_FRAMES);
  const video = await loadVideo(file);
  const metaDuration = video.duration;
  const metaUnreliable = !Number.isFinite(metaDuration) || metaDuration < 0.5;

  // Trust a stopwatch-measured recording length over broken file metadata —
  // but only when the file actually has substance (a real 10s clip is never
  // a few KB; a near-empty file is genuinely broken, not mislabeled).
  const hasSubstance = file.size > 20_000;
  const duration =
    metaUnreliable && hasSubstance && fallbackDurationSec && fallbackDurationSec >= 1
      ? fallbackDurationSec
      : metaDuration;

  console.warn(
    `[videoFrameExtractor] size=${(file.size / 1024).toFixed(0)}KB type=${file.type} ` +
      `metaDuration=${metaDuration} fallback=${fallbackDurationSec} using=${duration}`,
  );

  if (!Number.isFinite(duration) || duration < 0.5) {
    URL.revokeObjectURL(video.src);
    throw new Error(
      `Couldn't read that video (${(file.size / 1024).toFixed(0)} KB saved). Please try recording again.`,
    );
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available.");

  // Calculate timestamps: skip first/last 5% to avoid black frames
  const start = duration * 0.05;
  const end = duration * 0.95;
  const interval = (end - start) / (count - 1 || 1);
  const timestamps = Array.from({ length: count }, (_, i) =>
    count === 1 ? duration / 2 : start + i * interval,
  );

  const frames: File[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    onProgress?.({ current: i + 1, total: count });
    try {
      await seekTo(video, timestamps[i]);
      const frame = await captureFrame(video, canvas, ctx, i);
      frames.push(frame);
    } catch (err) {
      console.warn(`[videoFrameExtractor] frame ${i + 1} failed:`, err);
    }
  }

  URL.revokeObjectURL(video.src);

  if (frames.length === 0) {
    throw new Error(
      "Couldn't pull any pictures out of that video. Please try recording again.",
    );
  }
  return frames;
}

/**
 * Check if a file is a supported video type.
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Maximum video file size in bytes (50 MB).
 */
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
