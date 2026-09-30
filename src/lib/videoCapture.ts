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

/** Best-effort MediaRecorder mime type: vp9 -> vp8 -> webm -> mp4 -> default. */
export function pickVideoMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
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
