import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "../useSpeechRecognition";

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe("");
    expect(result.current.silenceCountdown).toBe(0);
    expect(result.current.voiceOwner).toBeNull();
    expect(typeof result.current.startListening).toBe("function");
    expect(typeof result.current.stopListening).toBe("function");
    expect(typeof result.current.setTranscript).toBe("function");
    expect(typeof result.current.resetOwner).toBe("function");
  });

  it("detects STT support based on window API", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    // jsdom doesn't have SpeechRecognition
    expect(result.current.supportsSTT).toBe(false);
  });

  it("returns false from startListening when STT is unsupported", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const voiceEnabledRef = { current: true };
    const stopAudio = vi.fn();

    let started = false;
    act(() => {
      started = result.current.startListening(voiceEnabledRef, stopAudio);
    });

    expect(started).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it("returns false when voiceEnabled is false", () => {
    // Mock SpeechRecognition
    (window as any).SpeechRecognition = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition());
    const voiceEnabledRef = { current: false };

    let started = false;
    act(() => {
      started = result.current.startListening(voiceEnabledRef, vi.fn());
    });

    expect(started).toBe(false);
    delete (window as any).SpeechRecognition;
  });

  it("starts listening with a mock SpeechRecognition", () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useSpeechRecognition());
    const voiceEnabledRef = { current: true };
    const stopAudio = vi.fn();

    let started = false;
    act(() => {
      started = result.current.startListening(voiceEnabledRef, stopAudio, "chat");
    });

    expect(started).toBe(true);
    expect(stopAudio).toHaveBeenCalled();
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.voiceOwner).toBe("chat");

    // Simulate onstart
    act(() => {
      mockRecognition.onstart();
    });
    expect(result.current.isListening).toBe(true);

    // Simulate onend
    act(() => {
      mockRecognition.onend();
    });
    expect(result.current.isListening).toBe(false);

    delete (window as any).SpeechRecognition;
  });

  it("stopListening aborts recognition", () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useSpeechRecognition());
    const voiceEnabledRef = { current: true };

    act(() => {
      result.current.startListening(voiceEnabledRef, vi.fn(), "chat");
    });

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.abort).toHaveBeenCalled();
    delete (window as any).SpeechRecognition;
  });

  it("stopListening ignores mismatched owner", () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening({ current: true }, vi.fn(), "chat");
    });

    act(() => {
      result.current.stopListening("other-owner");
    });

    // abort should NOT have been called since owner doesn't match
    expect(mockRecognition.abort).not.toHaveBeenCalled();
    delete (window as any).SpeechRecognition;
  });

  it("resetOwner clears the voice owner", () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening({ current: true }, vi.fn(), "chat");
    });
    expect(result.current.voiceOwner).toBe("chat");

    act(() => {
      result.current.resetOwner();
    });
    expect(result.current.voiceOwner).toBeNull();

    delete (window as any).SpeechRecognition;
  });

  it("updates transcript on recognition result", () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening({ current: true }, vi.fn());
    });

    // Simulate result event
    const fakeEvent = {
      results: [{ 0: { transcript: "hello world" }, length: 1 }],
      [Symbol.iterator]: function* () {
        yield* this.results;
      },
    };
    // SpeechRecognitionResultList is array-like
    (fakeEvent.results as any)[Symbol.iterator] = function* () {
      for (const r of fakeEvent.results) yield r;
    };

    act(() => {
      mockRecognition.onresult(fakeEvent);
    });
    expect(result.current.transcript).toBe("hello world");

    delete (window as any).SpeechRecognition;
  });
});
