import { describe, it, expect } from "vitest";
import {
  validateVideoMetadata,
  validateVideoFile,
  detectAudioTrack,
  blobToVideoFile,
  getVideoMetadata,
  REJECTION_MESSAGES,
  MIN_VIDEO_DURATION_SEC,
  type VideoMetadata,
  type VideoElementFactory,
} from "@/lib/videoValidation";

function meta(overrides: Partial<VideoMetadata> = {}): VideoMetadata {
  return {
    durationSec: 10,
    width: 1280,
    height: 720,
    audio: "unknown",
    ...overrides,
  };
}

function videoFile(size: number, type = "video/mp4"): File {
  return new File([new Uint8Array(size)], "clip.mp4", { type });
}

describe("validateVideoMetadata", () => {
  it("accepts a healthy clip with detected audio", () => {
    const r = validateVideoMetadata(videoFile(500_000), meta({ audio: "detected" }));
    expect(r.ok).toBe(true);
  });

  it("accepts when audio status is unknown (server re-checks)", () => {
    const r = validateVideoMetadata(videoFile(500_000), meta({ audio: "unknown" }));
    expect(r.ok).toBe(true);
  });

  it("rejects clips under 3 seconds in plain language", () => {
    const r = validateVideoMetadata(videoFile(500_000), meta({ durationSec: 2.9 }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("too-short");
      expect(r.message).toContain("3 seconds");
      expect(r.message).not.toMatch(/codec|metadata|encode/i);
    }
  });

  it("rejects exactly at the boundary below minimum", () => {
    const r = validateVideoMetadata(
      videoFile(500_000),
      meta({ durationSec: MIN_VIDEO_DURATION_SEC - 0.01 }),
    );
    expect(r.ok).toBe(false);
  });

  it("accepts exactly at the 3-second minimum", () => {
    const r = validateVideoMetadata(
      videoFile(500_000),
      meta({ durationSec: MIN_VIDEO_DURATION_SEC }),
    );
    expect(r.ok).toBe(true);
  });

  it("rejects silent clips where the browser could tell", () => {
    const r = validateVideoMetadata(videoFile(500_000), meta({ audio: "absent" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("no-audio");
      expect(r.message).toContain("microphone");
    }
  });

  it("rejects empty/truncated files", () => {
    const r = validateVideoMetadata(videoFile(0), meta());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-small");
  });

  it("rejects oversized files", () => {
    const r = validateVideoMetadata(videoFile(60 * 1024 * 1024), meta());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-large");
  });

  it("rejects non-video MIME types", () => {
    const r = validateVideoMetadata(videoFile(500_000, "image/jpeg"), meta());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-video");
  });

  it("rejects NaN durations", () => {
    const r = validateVideoMetadata(videoFile(500_000), meta({ durationSec: NaN }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-short");
  });
});

describe("detectAudioTrack", () => {
  it("reads webkitAudioDecodedByteCount when present", () => {
    expect(detectAudioTrack({ webkitAudioDecodedByteCount: 1234 } as never)).toBe("detected");
    expect(detectAudioTrack({ webkitAudioDecodedByteCount: 0 } as never)).toBe("absent");
  });

  it("reads mozHasAudio when present", () => {
    expect(detectAudioTrack({ mozHasAudio: true } as never)).toBe("detected");
    expect(detectAudioTrack({ mozHasAudio: false } as never)).toBe("absent");
  });

  it("returns unknown when the browser exposes nothing", () => {
    expect(detectAudioTrack({} as never)).toBe("unknown");
  });
});

describe("blobToVideoFile", () => {
  it("names mp4 blobs with .mp4", () => {
    const f = blobToVideoFile(new Blob(["x"], { type: "video/mp4" }), "video/mp4");
    expect(f.name).toMatch(/\.mp4$/);
    expect(f.type).toBe("video/mp4");
    expect(f instanceof File).toBe(true);
  });

  it("defaults webm extension otherwise", () => {
    const f = blobToVideoFile(new Blob(["x"], { type: "video/webm" }), "video/webm");
    expect(f.name).toMatch(/\.webm$/);
  });
});

/** Fake video element: setting src fires onloadedmetadata on next tick. */
function fakeFactory(props: Record<string, unknown> = {}): VideoElementFactory {
  const stub = {
    preload: "",
    muted: false,
    onloadedmetadata: null as null | (() => void),
    onerror: null as null | (() => void),
    duration: 10,
    videoWidth: 1280,
    videoHeight: 720,
    ...props,
  } as Record<string, unknown>;
  Object.defineProperty(stub, "src", {
    set(_v: string) {
      setTimeout(() => {
        const cb = stub.onloadedmetadata as null | (() => void);
        cb?.();
      }, 0);
    },
  });
  Object.defineProperty(stub, "playsInline", { value: false, writable: true });
  return {
    create: () => stub as unknown as HTMLVideoElement,
    objectUrlFor: () => "blob:fake",
    revokeObjectUrl: () => {},
  };
}

describe("getVideoMetadata + validateVideoFile (mocked element)", () => {
  it("resolves metadata from the fake element", async () => {
    const m = await getVideoMetadata(videoFile(500_000), fakeFactory());
    expect(m.durationSec).toBe(10);
    expect(m.audio).toBe("unknown");
  });

  it("validateVideoFile passes a healthy fake clip", async () => {
    const r = await validateVideoFile(videoFile(500_000), fakeFactory());
    expect(r.ok).toBe(true);
  });

  it("validateVideoFile rejects a too-short fake clip", async () => {
    const r = await validateVideoFile(videoFile(500_000), fakeFactory({ duration: 1.5 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-short");
  });

  it("validateVideoFile rejects silent fake clips", async () => {
    const r = await validateVideoFile(
      videoFile(500_000),
      fakeFactory({ webkitAudioDecodedByteCount: 0 }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("no-audio");
  });

  it("every rejection message is plain language", () => {
    for (const msg of Object.values(REJECTION_MESSAGES)) {
      expect(msg).not.toMatch(/codec|MIME|metadata|encode|decode|bitrate/i);
      expect(msg.length).toBeGreaterThan(20);
    }
  });
});
