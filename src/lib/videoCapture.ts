/**
 * Feature-detection for the in-chat video capture flow.
 * Kept in its own module so component files stay react-refresh clean.
 */

/** True when the browser can do in-page camera+mic capture. */
export function isVideoCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Best-effort MediaRecorder mime type. */
export function pickVideoMimeType(): string {
  const webmCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  // Safari (desktop + every iOS browser, all WebKit under the hood) records
  // most reliably to mp4 — its webm duration metadata is unreliable, which
  // breaks downstream frame extraction.
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isWebKit = /Safari/.test(ua) && !/Chrome|Chromium/.test(ua);
  const candidates = isWebKit
    ? ["video/mp4", ...webmCandidates]
    : webmCandidates;
  try {
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) return c;
    }
  } catch {
    /* ignore */
  }
  return "";
}

/** Extension matching a MediaRecorder mime type. */
export function videoExtensionForMimeType(mimeType: string): string {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

/**
 * True on iPhone/iPad (and iPadOS masquerading as desktop Safari).
 * iOS is forced onto the native-camera strategy even where MediaRecorder
 * technically exists: in-page recording on iOS has unreliable duration
 * metadata and no dependable retake UX, while the native camera app gives
 * a real viewfinder plus the OS retake flow for free.
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSUA = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS =
    /Macintosh/.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  return isIOSUA || isIPadOS;
}

/**
 * Strategy selector: native camera picker vs in-browser recorder.
 * Native wins on iOS and anywhere getUserMedia/MediaRecorder is missing.
 */
export function shouldUseNativeCapture(): boolean {
  return isIOSDevice() || !isVideoCaptureSupported();
}
