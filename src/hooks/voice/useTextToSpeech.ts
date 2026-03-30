import { useState, useRef, useCallback, useEffect } from "react";
import type { AgentType } from "@/components/MechanicAvatar";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-tts`;

function createSilentWavBlob(durationMs = 120, sampleRate = 8000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.max(1, Math.floor((durationMs / 1000) * sampleRate));
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let offset = 0;
  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
    offset += value.length;
  };

  writeString("RIFF");
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bitsPerSample, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}

/** Strip markdown / agent tags for cleaner speech output. */
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "")
    .replace(/[#*_~`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, ". ")
    .trim();
}

// Resolves when the current speak() call finishes playback (or immediately if nothing is playing).
type SpeakDoneResolver = (() => void) | null;

export function useTextToSpeech(
  voiceEnabledRef: React.RefObject<boolean>,
  onSpeechEnd: () => void,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const lastSpokenRef = useRef("");
  const playbackUnlockedRef = useRef(false);
  const mountedRef = useRef(true);
  const speechEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakDoneResolverRef = useRef<SpeakDoneResolver>(null);

  const supportsTTS = true; // Azure TTS is always available

  const clearSpeechEndTimeout = useCallback(() => {
    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }
  }, []);

  const queueResumeListening = useCallback(() => {
    clearSpeechEndTimeout();
    if (!voiceEnabledRef.current) return;
    speechEndTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || !voiceEnabledRef.current) return;
      onSpeechEnd();
    }, 400);
  }, [clearSpeechEndTimeout, onSpeechEnd, voiceEnabledRef]);

  const setSpeakingSafe = useCallback((value: boolean) => {
    if (!mountedRef.current) return;
    setIsSpeaking(value);
  }, []);

  const stopAudio = useCallback(() => {
    clearSpeechEndTimeout();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = "";
    }
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    setSpeakingSafe(false);
  }, [clearSpeechEndTimeout, setSpeakingSafe]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearSpeechEndTimeout();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, [clearSpeechEndTimeout]);

  const unlockAudioPlayback = useCallback(async () => {
    if (playbackUnlockedRef.current) return true;
    if (typeof window === "undefined") return false;

    let primerUrl: string | null = null;
    try {
      const primer = audioRef.current ?? new Audio();
      audioRef.current = primer;
      primerUrl = URL.createObjectURL(createSilentWavBlob());
      primer.src = primerUrl;
      primer.muted = true;
      primer.volume = 0;
      if (typeof (primer as HTMLAudioElement & { setAttribute?: (name: string, value: string) => void }).setAttribute === "function") {
        primer.setAttribute("playsinline", "true");
      }
      primer.preload = "auto";
      await primer.play();
      primer.pause();
      primer.currentTime = 0;
      primer.muted = false;
      primer.volume = 1;
      playbackUnlockedRef.current = true;
      return true;
    } catch (mediaErr) {
      console.warn("Audio element unlock failed, trying AudioContext fallback:", mediaErr);

      try {
        const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return false;

        const ctx = new AudioContextCtor();
        await ctx.resume();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.02);
        playbackUnlockedRef.current = true;
        return true;
      } catch (ctxErr) {
        console.warn("Audio playback unlock failed:", ctxErr);
        return false;
      }
    } finally {
      if (primerUrl) URL.revokeObjectURL(primerUrl);
    }
  }, []);

  const speakWithBrowserTTS = useCallback(
    (text: string, agent: AgentType) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        console.error("Browser speech synthesis not available");
        setSpeakingSafe(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = agent === "sam" ? "en-GB" : "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        setSpeakingSafe(false);
        queueResumeListening();
      };
      utterance.onerror = () => {
        setSpeakingSafe(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [queueResumeListening, setSpeakingSafe],
  );

  const speak = useCallback(
    async (text: string, agent: AgentType) => {
      console.log("[VoiceDebug:TTS] speak() called, voiceEnabledRef:", voiceEnabledRef.current, "textLen:", text?.length);
      if (!voiceEnabledRef.current || !text) {
        console.log("[VoiceDebug:TTS] speak() bailed: voiceEnabled=", voiceEnabledRef.current, "hasText=", !!text);
        return;
      }

      const clean = cleanTextForSpeech(text);
      if (!clean || clean === lastSpokenRef.current) {
        console.log("[VoiceDebug:TTS] speak() dedup skip, clean===last:", clean === lastSpokenRef.current);
        return;
      }
      lastSpokenRef.current = clean;

      stopAudio();
      setSpeakingSafe(true);

      try {
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: clean, agent }),
        });

        if (!response.ok) {
          console.error("Azure TTS error:", response.status);
          throw new Error(`Azure TTS ${response.status}`);
        }

        console.log("[VoiceDebug:TTS] fetch response ok:", response.ok, "status:", response.status, "contentType:", response.headers.get("content-type"));

        const audioBlob = await response.blob();
        console.log("[VoiceDebug:TTS] blob size:", audioBlob.size, "type:", audioBlob.type);
        const audioUrl = URL.createObjectURL(audioBlob);
        activeObjectUrlRef.current = audioUrl;

        // Reuse one audio element to keep playback unlocked on mobile browsers.
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = audioUrl;
        audio.muted = false;
        audio.volume = 1;
        audio.preload = "auto";
        if (typeof (audio as HTMLAudioElement & { setAttribute?: (name: string, value: string) => void }).setAttribute === "function") {
          audio.setAttribute("playsinline", "true");
        }

        audio.onended = () => {
          setSpeakingSafe(false);
          if (activeObjectUrlRef.current) {
            URL.revokeObjectURL(activeObjectUrlRef.current);
            activeObjectUrlRef.current = null;
          }
          queueResumeListening();
        };

        audio.onerror = () => {
          if (activeObjectUrlRef.current) {
            URL.revokeObjectURL(activeObjectUrlRef.current);
            activeObjectUrlRef.current = null;
          }
          console.warn("Cloud TTS playback failed, falling back to browser speech synthesis");
          speakWithBrowserTTS(clean, agent);
        };

        try {
          await audio.play();
          console.log("[VoiceDebug:TTS] audio.play() succeeded");
        } catch (playErr) {
          console.warn("[VoiceDebug:TTS] audio.play() failed, retrying after unlock:", playErr);
          // Mobile browsers can still reject play() if unlock wasn't fully registered.
          // Retry once after explicit unlock before falling back.
          const unlocked = await unlockAudioPlayback();
          if (unlocked) {
            await audio.play();
          } else {
            throw playErr;
          }
        }
      } catch (err) {
        console.warn("Cloud TTS failed, falling back to browser speech synthesis:", err);
        speakWithBrowserTTS(clean, agent);
      }
    },
    [stopAudio, speakWithBrowserTTS, unlockAudioPlayback, setSpeakingSafe, queueResumeListening],
  );

  const resetLastSpoken = useCallback(() => {
    lastSpokenRef.current = "";
  }, []);

  return {
    isSpeaking,
    supportsTTS,
    speak,
    stopSpeaking: stopAudio,
    stopAudio,
    unlockAudioPlayback,
    resetLastSpoken,
  };
}
