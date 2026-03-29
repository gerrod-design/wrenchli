import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceChat } from "../useVoiceChatOrchestrator";

/* ── Mocks ──────────────────────────────────────────────── */

// Minimal SpeechRecognition mock
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;

  start() {
    setTimeout(() => this.onstart?.(), 0);
  }
  stop() {
    setTimeout(() => this.onend?.(), 0);
  }
  abort() {
    this.onend?.();
  }

  /** Helper to simulate a final transcript result */
  simulateResult(text: string) {
    this.onresult?.({
      results: [{ 0: { transcript: text }, length: 1 }],
      [Symbol.iterator]: function* () {
        yield { 0: { transcript: text }, length: 1 };
      },
    });
  }
}

let lastRecognitionInstance: MockSpeechRecognition | null = null;

// Mock fetch for Azure TTS
const mockAudioPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioPause = vi.fn();

beforeEach(() => {
  lastRecognitionInstance = null;
  (window as any).SpeechRecognition = class extends MockSpeechRecognition {
    constructor() {
      super();
      lastRecognitionInstance = this;
    }
  };

  // Mock Audio constructor
  vi.stubGlobal(
    "Audio",
    class {
      src = "";
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play = mockAudioPlay;
      pause = mockAudioPause;
    },
  );

  // Mock speechSynthesis
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    speak: vi.fn((utterance: any) => {
      setTimeout(() => utterance.onend?.(), 10);
    }),
  });

  // Mock URL methods
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });

  // Default fetch mock returning audio blob
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["audio"], { type: "audio/wav" })),
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).SpeechRecognition;
});

/* ── Tests ──────────────────────────────────────────────── */

describe("useVoiceChatOrchestrator", () => {
  it("starts with voice disabled", () => {
    const { result } = renderHook(() => useVoiceChat());
    expect(result.current.voiceEnabled).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
  });

  it("toggleVoice flips voiceEnabled state", () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => result.current.toggleVoice());
    expect(result.current.voiceEnabled).toBe(true);

    act(() => result.current.toggleVoice());
    expect(result.current.voiceEnabled).toBe(false);
  });

  it("startListening returns false when voice is disabled", () => {
    const { result } = renderHook(() => useVoiceChat());
    let started = false;
    act(() => {
      started = result.current.startListening("test-owner");
    });
    expect(started).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it("startListening returns true when voice is enabled", async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => result.current.toggleVoice());

    let started = false;
    act(() => {
      started = result.current.startListening("test-owner");
    });
    expect(started).toBe(true);

    // Wait for SpeechRecognition.onstart to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.isListening).toBe(true);
    expect(result.current.voiceOwner).toBe("test-owner");
  });

  it("stopListening stops recognition", async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => result.current.toggleVoice());
    act(() => result.current.startListening("owner"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.isListening).toBe(true);

    act(() => result.current.stopListening());
    expect(result.current.isListening).toBe(false);
  });

  it("speak calls Azure TTS when voice is enabled", async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("Hello world", "mike");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("azure-tts"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.isSpeaking).toBe(true);
  });

  it("speak is a no-op when voice is disabled", async () => {
    const { result } = renderHook(() => useVoiceChat());

    await act(async () => {
      await result.current.speak("Hello world", "mike");
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("disabling voice stops audio and clears owner", async () => {
    const { result } = renderHook(() => useVoiceChat());

    // Enable, start listening, then disable
    act(() => result.current.toggleVoice());
    act(() => result.current.startListening("owner"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.isListening).toBe(true);

    act(() => result.current.toggleVoice());
    expect(result.current.voiceEnabled).toBe(false);
    expect(result.current.voiceOwner).toBeNull();
  });

  it("transcript updates when STT produces results", async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => result.current.toggleVoice());
    act(() => result.current.startListening("owner"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Simulate speech result
    act(() => {
      lastRecognitionInstance?.simulateResult("squeaky brakes");
    });
    expect(result.current.transcript).toBe("squeaky brakes");
  });

  it("speak deduplicates identical messages", async () => {
    const { result } = renderHook(() => useVoiceChat());
    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("Same message", "mike");
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second call with same text should be skipped
    await act(async () => {
      await result.current.speak("Same message", "mike");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("toggleVoice off resets dedup so same text can be spoken again", async () => {
    const { result } = renderHook(() => useVoiceChat());
    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("Repeat me", "mike");
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    // Toggle off then on — resets dedup
    act(() => result.current.toggleVoice());
    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("Repeat me", "mike");
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to browser TTS when Azure fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const { result } = renderHook(() => useVoiceChat());
    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("Fallback test", "sam");
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("speak strips agent tags and markdown before sending to TTS", async () => {
    const { result } = renderHook(() => useVoiceChat());
    act(() => result.current.toggleVoice());

    await act(async () => {
      await result.current.speak("[Agent: Mike] **Hello** _world_", "mike");
    });

    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.text).toBe("Hello world");
    expect(body.text).not.toContain("[Agent:");
    expect(body.text).not.toContain("**");
  });
});
