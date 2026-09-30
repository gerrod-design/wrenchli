import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isVideoCaptureSupported,
  pickVideoMimeType,
  videoExtensionForMimeType,
} from "@/lib/videoCapture";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isVideoCaptureSupported", () => {
  it("returns false when mediaDevices.getUserMedia is missing", () => {
    vi.stubGlobal("navigator", { mediaDevices: {} });
    expect(isVideoCaptureSupported()).toBe(false);
  });

  it("returns false when MediaRecorder is missing", () => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({}) } });
    vi.stubGlobal("MediaRecorder", undefined);
    expect(isVideoCaptureSupported()).toBe(false);
  });

  it("returns true when both APIs exist", () => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({}) } });
    vi.stubGlobal("MediaRecorder", function () {});
    expect(isVideoCaptureSupported()).toBe(true);
  });
});

describe("pickVideoMimeType", () => {
  it("prefers vp9, then vp8, then webm, then mp4", () => {
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (t: string) => t === "video/webm;codecs=vp8,opus",
    });
    expect(pickVideoMimeType()).toBe("video/webm;codecs=vp8,opus");
  });

  it("falls back to mp4 when only mp4 is supported (iOS Safari)", () => {
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (t: string) => t === "video/mp4",
    });
    expect(pickVideoMimeType()).toBe("video/mp4");
  });

  it("returns empty string when nothing is supported", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => false });
    expect(pickVideoMimeType()).toBe("");
  });

  it("returns empty string when MediaRecorder is undefined", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    expect(pickVideoMimeType()).toBe("");
  });
});

describe("videoExtensionForMimeType", () => {
  it("maps mp4 mime types to mp4", () => {
    expect(videoExtensionForMimeType("video/mp4")).toBe("mp4");
  });
  it("maps webm mime types to webm", () => {
    expect(videoExtensionForMimeType("video/webm;codecs=vp9,opus")).toBe("webm");
  });
  it("defaults to webm", () => {
    expect(videoExtensionForMimeType("")).toBe("webm");
  });
});
