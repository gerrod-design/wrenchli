import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
}

const MAX_DURATION_MS = 30_000; // 30 seconds max
const WAV_MIME_TYPE = "audio/wav";

type BrowserAudioContext = typeof AudioContext;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function encodeWav(buffer: AudioBuffer): Blob {
  const channelCount = Math.min(buffer.numberOfChannels, 2);
  const sampleCount = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + sampleCount * blockAlign);
  const view = new DataView(wavBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * blockAlign, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * blockAlign, true);

  const channels = Array.from({ length: channelCount }, (_, i) => buffer.getChannelData(i));
  let offset = 44;
  for (let i = 0; i < sampleCount; i += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([wavBuffer], { type: WAV_MIME_TYPE });
}

async function convertRecordingToWav(blob: Blob): Promise<Blob> {
  if (blob.type.toLowerCase().includes("wav")) return blob;
  const AudioContextCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext);
  if (!AudioContextCtor) throw new Error("Audio conversion is not supported on this device.");

  const audioContext = new AudioContextCtor();
  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(decoded);
  } finally {
    void audioContext.close();
  }
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      setAudioBlob(null);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        cleanup();
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        void convertRecordingToWav(blob)
          .then(setAudioBlob)
          .catch(() => setAudioBlob(blob))
          .finally(() => setIsRecording(false));
      };

      recorder.onerror = () => {
        cleanup();
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect data every 250ms
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration counter
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop at max duration
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_DURATION_MS);

      return true;
    } catch {
      return false;
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingDuration(0);
  }, []);

  const supportsRecording = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    supportsRecording,
  };
}
