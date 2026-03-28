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
 */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      // Small delay to ensure frame is painted
      requestAnimationFrame(() => resolve());
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
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
 * @returns           Array of JPEG File objects
 */
export async function extractVideoFrames(
  file: File,
  numFrames = MAX_FRAMES,
  onProgress?: (p: ExtractionProgress) => void,
): Promise<File[]> {
  const count = Math.min(numFrames, MAX_FRAMES);
  const video = await loadVideo(file);
  const duration = video.duration;

  if (!duration || duration < 0.5) {
    URL.revokeObjectURL(video.src);
    throw new Error("Video is too short to extract frames.");
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
    await seekTo(video, timestamps[i]);
    const frame = await captureFrame(video, canvas, ctx, i);
    frames.push(frame);
  }

  URL.revokeObjectURL(video.src);
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
