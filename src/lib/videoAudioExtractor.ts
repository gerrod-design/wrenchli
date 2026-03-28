/**
 * Extract the audio track from a video file as a WAV blob.
 * Uses the Web Audio API to decode the video's audio stream.
 * Returns null if the video has no audio or if extraction fails.
 */

export async function extractVideoAudio(
  file: File,
  maxDurationSec = 30,
): Promise<Blob | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      // Video has no audio track or format not decodable
      await audioCtx.close();
      return null;
    }

    // Trim to maxDurationSec
    const duration = Math.min(audioBuffer.duration, maxDurationSec);
    const sampleRate = Math.min(audioBuffer.sampleRate, 16000); // 16kHz is enough for noise analysis
    const numSamples = Math.floor(duration * sampleRate);
    const numChannels = 1; // mono is fine for car noise

    // Resample to mono 16kHz
    const offlineCtx = new OfflineAudioContext(numChannels, numSamples, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, 0, duration);

    const renderedBuffer = await offlineCtx.startRendering();
    const pcmData = renderedBuffer.getChannelData(0);

    // Encode as WAV
    const wavBlob = encodeWav(pcmData, sampleRate);

    await audioCtx.close();
    return wavBlob;
  } catch (err) {
    console.warn("Audio extraction failed:", err);
    return null;
  }
}

/**
 * Encode raw PCM float32 data as a WAV file.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM samples (clamp to 16-bit range)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
