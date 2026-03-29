import { useState, useRef, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useTextToSpeech } from "./useTextToSpeech";

/**
 * Orchestrator that composes STT + TTS into a unified voice-chat interface.
 * This is the single public API consumed by VoiceChatContext.
 */
export function useVoiceChat() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const voiceEnabledRef = useRef(false);

  const {
    isListening,
    transcript,
    setTranscript,
    silenceCountdown,
    voiceOwner,
    voiceOwnerRef,
    supportsSTT,
    startListening: sttStart,
    stopListening,
    resetOwner,
  } = useSpeechRecognition();

  // Wrap startListening to inject shared refs
  const startListening = useCallback(
    (owner?: string): boolean => sttStart(voiceEnabledRef, tts.stopAudio, owner),
    // tts.stopAudio is stable (useCallback with []), safe to reference below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // onSpeechEnd callback: auto-listen after TTS finishes
  const onSpeechEnd = useCallback(() => {
    startListening();
  }, [startListening]);

  const tts = useTextToSpeech(voiceEnabledRef, onSpeechEnd);

  // Re-bind startListening now that tts is available
  const startListeningBound = useCallback(
    (owner?: string): boolean => sttStart(voiceEnabledRef, tts.stopAudio, owner),
    [sttStart, tts.stopAudio],
  );

  // Cancel everything when voice mode is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      tts.stopAudio();
      resetOwner();
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      voiceEnabledRef.current = next;
      if (prev) tts.resetLastSpoken();
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    voiceEnabled,
    toggleVoice,
    isListening,
    isSpeaking: tts.isSpeaking,
    transcript,
    voiceOwner,
    setTranscript,
    startListening: startListeningBound,
    stopListening,
    speak: tts.speak,
    stopSpeaking: tts.stopSpeaking,
    supportsSTT,
    supportsTTS: tts.supportsTTS,
    silenceCountdown,
  };
}
