import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTextToSpeech } from "../useTextToSpeech";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useTextToSpeech", () => {
  const voiceEnabledRef = { current: true };
  const onSpeechEnd = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    voiceEnabledRef.current = true;
    onSpeechEnd.mockClear();
    mockFetch.mockReset();
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.supportsTTS).toBe(true);
    expect(typeof result.current.speak).toBe("function");
    expect(typeof result.current.stopSpeaking).toBe("function");
    expect(typeof result.current.stopAudio).toBe("function");
    expect(typeof result.current.resetLastSpoken).toBe("function");
  });

  it("does not speak when voiceEnabled is false", async () => {
    voiceEnabledRef.current = false;
    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("Hello", "mike");
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("does not speak empty text", async () => {
    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("", "mike");
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("strips markdown and agent tags from text", async () => {
    // Mock a successful TTS response
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onended: null as any,
      onerror: null as any,
    };
    vi.stubGlobal("Audio", vi.fn(() => mockAudio));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["audio"])),
    });

    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("[Agent: Mike] **Hello** _world_", "mike");
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe("Hello world");
    expect(body.agent).toBe("mike");
  });

  it("deduplicates identical text", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["audio"])),
    });

    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onended: null as any,
      onerror: null as any,
    };
    vi.stubGlobal("Audio", vi.fn(() => mockAudio));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("Same text", "mike");
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.speak("Same text", "mike");
    });
    // Should not call fetch again for identical text
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("resetLastSpoken allows re-speaking the same text", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["audio"])),
    });

    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onended: null as any,
      onerror: null as any,
    };
    vi.stubGlobal("Audio", vi.fn(() => mockAudio));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("Repeat me", "mike");
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.resetLastSpoken();
    });

    await act(async () => {
      await result.current.speak("Repeat me", "mike");
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to browser TTS when Azure fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const mockUtterance = {
      lang: "",
      rate: 0,
      pitch: 0,
      onend: null as any,
      onerror: null as any,
    };
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn(() => mockUtterance),
    );

    const mockSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynthesis,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    await act(async () => {
      await result.current.speak("Fallback test", "sam");
    });

    expect(mockSynthesis.speak).toHaveBeenCalled();
  });

  it("stopAudio pauses current audio and resets state", () => {
    const { result } = renderHook(() =>
      useTextToSpeech(voiceEnabledRef, onSpeechEnd),
    );

    act(() => {
      result.current.stopAudio();
    });

    expect(result.current.isSpeaking).toBe(false);
  });
});
