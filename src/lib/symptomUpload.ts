import { extractVideoFrames } from '@/lib/videoFrameExtractor';
import { extractVideoAudio } from '@/lib/videoAudioExtractor';
import { supabase } from '@/integrations/supabase/client';
import type { SenseBundle, SymptomAnalysisResponse } from '@/types/symptom';

interface UploadSymptomVideoArgs {
  videoFile: File;
  bundle: SenseBundle;
}

/**
 * Shared POST to the analyze-video-combined edge function (symptom mode).
 * Throws `Analysis failed: <status> - <body>` on a non-OK response.
 */
async function postSymptomAnalysis(
  formData: FormData
): Promise<SymptomAnalysisResponse> {
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/analyze-video-combined`,
    {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
  }

  const result: SymptomAnalysisResponse = await response.json();
  return result;
}

export async function uploadSymptomVideo({
  videoFile,
  bundle,
}: UploadSymptomVideoArgs): Promise<SymptomAnalysisResponse> {
  try {
    // Step 1: Extract frames
    const frames = await extractVideoFrames(videoFile, 4);

    // Step 2: Extract audio
    const audioFile = await extractVideoAudio(videoFile);

    // Step 3: Upload frames to Supabase storage and get signed URLs
    const frameUrls: string[] = [];

    for (const frame of frames) {
      const frameUuid = crypto.randomUUID();
      const fileName = `chat-${frameUuid}.jpg`;

      // Upload frame blob to damage-photos bucket
      const { error: uploadError } = await supabase.storage
        .from('damage-photos')
        .upload(fileName, frame, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(`Failed to upload frame: ${uploadError.message}`);
      }

      // Create signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('damage-photos')
        .createSignedUrl(fileName, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
      }

      frameUrls.push(signedUrlData.signedUrl);
    }

    // Step 4: Build FormData
    const formData = new FormData();
    formData.append('analysis_mode', 'symptom');
    formData.append('frame_urls', JSON.stringify(frameUrls));

    if (audioFile) {
      formData.append('audio', audioFile);
    }

    if (bundle.vehicleContext) {
      formData.append('vehicle_context', JSON.stringify(bundle.vehicleContext));
    }

    formData.append('sense_bundle', JSON.stringify(bundle));

    // Step 5: POST to edge function
    return await postSymptomAnalysis(formData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload symptom video: ${error.message}`);
    }
    throw new Error('Failed to upload symptom video: Unknown error');
  }
}

/**
 * Bundle-only symptom submission — no video, no frames, no audio.
 * Used by the smell-first and feel-first paths when the driver skips
 * the optional video. The edge function accepts zero-media symptom
 * submissions when a valid sense_bundle is present.
 */
export async function submitSymptomBundle(
  bundle: SenseBundle
): Promise<SymptomAnalysisResponse> {
  try {
    const formData = new FormData();
    formData.append('analysis_mode', 'symptom');

    if (bundle.vehicleContext) {
      formData.append('vehicle_context', JSON.stringify(bundle.vehicleContext));
    }

    formData.append('sense_bundle', JSON.stringify(bundle));

    return await postSymptomAnalysis(formData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to submit symptom report: ${error.message}`);
    }
    throw new Error('Failed to submit symptom report: Unknown error');
  }
}
