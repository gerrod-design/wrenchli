import { useState } from 'react';
import type { SenseBundle, SymptomAnalysisResponse, SenseType } from '@/types/symptom';
import { FEATURE_NAME } from '@/data/senseChips';
import { SenseIntakeFlow } from './SenseIntakeFlow';
import { SymptomPrimer } from './SymptomPrimer';
import { SenseQuestionsStep } from './SenseQuestionsStep';
import { DirectedVideoPrompt } from './DirectedVideoPrompt';
import { SymptomResults } from './SymptomResults';
import VideoCapture from '@/components/capture/VideoCapture';
import { uploadSymptomVideo, submitSymptomBundle } from '@/lib/symptomUpload';
import { generatePrimerPrompt } from '@/lib/symptomBundleBuilder';
import { Button } from '@/components/ui/button';

type FlowStep =
  | 'primer'
  | 'form'
  | 'directed'
  | 'recording'
  | 'questions'
  | 'uploading'
  | 'results'
  | 'error';

type FlowPath = 'fallback' | 'video-first' | 'bundle-first';

interface SymptomFlowModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: SymptomAnalysisResponse, bundle: SenseBundle) => void;
}

export function SymptomFlowModal({ open, onClose, onResult }: SymptomFlowModalProps) {
  const [step, setStep] = useState<FlowStep>('primer');
  const [path, setPath] = useState<FlowPath>('fallback');
  const [primer, setPrimer] = useState<SenseType | null>(null);
  const [bundle, setBundle] = useState<SenseBundle | null>(null);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [result, setResult] = useState<SymptomAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadHasVideo, setUploadHasVideo] = useState(false);

  const handleReset = () => {
    setStep('primer');
    setPath('fallback');
    setPrimer(null);
    setBundle(null);
    setPendingVideo(null);
    setResult(null);
    setError(null);
    setUploadHasVideo(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const runUpload = async (
    call: () => Promise<SymptomAnalysisResponse>,
    submittedBundle: SenseBundle,
    hasVideo: boolean
  ) => {
    setUploadHasVideo(hasVideo);
    setStep('uploading');
    try {
      const analysisResult = await call();
      setResult(analysisResult);
      setStep('results');
      onResult(analysisResult, submittedBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStep('error');
    }
  };

  if (!open) return null;

  const renderStep = () => {
    switch (step) {
      case 'primer':
        return (
          <SymptomPrimer
            onSelect={(sense) => {
              setPrimer(sense);
              if (sense === 'HEAR' || sense === 'SEE') {
                setPath('video-first');
                setStep('directed');
              } else {
                setPath('bundle-first');
                setStep('questions');
              }
            }}
            onFallback={() => {
              setPath('fallback');
              setStep('form');
            }}
          />
        );

      case 'form':
        return (
          <SenseIntakeFlow
            onComplete={(b) => {
              setBundle(b);
              setStep('directed');
            }}
            onCancel={handleClose}
          />
        );

      case 'directed': {
        if (path === 'fallback') {
          return (
            <DirectedVideoPrompt
              bundle={bundle}
              onStartRecording={() => setStep('recording')}
              onBack={() => setStep('form')}
            />
          );
        }
        if (path === 'video-first') {
          return (
            <DirectedVideoPrompt
              bundle={null}
              promptText={generatePrimerPrompt(primer as SenseType)}
              onStartRecording={() => setStep('recording')}
              onBack={() => setStep('primer')}
            />
          );
        }
        return (
          <DirectedVideoPrompt
            bundle={null}
            promptText={generatePrimerPrompt(primer as SenseType)}
            onStartRecording={() => setStep('recording')}
            onBack={() => setStep('questions')}
          />
        );
      }

      case 'recording':
        return (
          <VideoCapture
            mode="symptom"
            onCancel={() => setStep('directed')}
            onCaptured={(blob: Blob | File) => {
              const file =
                blob instanceof File
                  ? blob
                  : new File([blob], 'symptom-video.webm', { type: blob.type });

              if (path === 'video-first') {
                setPendingVideo(file);
                setStep('questions');
              } else {
                runUpload(
                  () => uploadSymptomVideo({ videoFile: file, bundle: bundle! }),
                  bundle!,
                  true
                );
              }
            }}
          />
        );

      case 'questions': {
        if (path === 'video-first') {
          const senseForPrimer = primer as SenseType;
          return (
            <SenseQuestionsStep
              title="Two things video can't catch"
              subtitle="The video got the picture and the sound. Smell and feel are up to you."
              sections={[
                { sense: 'SMELL', heading: 'Any smell?', escapeChip: 'No unusual smell' },
                { sense: 'FEEL', heading: 'How does it feel?', escapeChip: 'Feels normal' },
                {
                  sense: senseForPrimer,
                  heading:
                    senseForPrimer === 'HEAR'
                      ? 'Anything to add about the sound?'
                      : 'Anything to add about what you saw?',
                },
              ]}
              showTiming
              primaryLabel="Get my assessment"
              onSubmit={(b) => {
                setBundle(b);
                runUpload(
                  () => uploadSymptomVideo({ videoFile: pendingVideo!, bundle: b }),
                  b,
                  true
                );
              }}
            />
          );
        }

        if (path === 'bundle-first' && primer === 'SMELL') {
          return (
            <SenseQuestionsStep
              title="Something smells — tell us more"
              sections={[
                { sense: 'SMELL', heading: 'What does it smell like?' },
                { sense: 'FEEL', heading: 'How does it feel?', escapeChip: 'Feels normal' },
              ]}
              showTiming
              requireSense="SMELL"
              primaryLabel="Get my assessment"
              onBack={() => setStep('primer')}
              secondaryAction={{
                label: 'Add a video',
                hint: 'Show us a leak, smoke, or a warning light — optional.',
                onAction: (b) => {
                  setBundle(b);
                  setStep('directed');
                },
              }}
              onSubmit={(b) => {
                setBundle(b);
                runUpload(() => submitSymptomBundle(b), b, false);
              }}
            />
          );
        }

        // path === 'bundle-first' && primer === 'FEEL'
        return (
          <SenseQuestionsStep
            title="It feels different — tell us more"
            sections={[
              { sense: 'FEEL', heading: 'How does it feel?' },
              { sense: 'SMELL', heading: 'Any smell?', escapeChip: 'No unusual smell' },
            ]}
            showTiming
            requireSense="FEEL"
            primaryLabel="Get my assessment"
            onBack={() => setStep('primer')}
            secondaryAction={{
              label: 'Add a video',
              hint: 'Only while parked, or mount the phone before you drive — never hold it while driving.',
              onAction: (b) => {
                setBundle(b);
                setStep('directed');
              },
            }}
            onSubmit={(b) => {
              setBundle(b);
              runUpload(() => submitSymptomBundle(b), b, false);
            }}
          />
        );
      }

      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <h2 className="text-lg font-semibold mt-6">
              {uploadHasVideo ? 'Analyzing your video' : 'Analyzing your report'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {uploadHasVideo
                ? 'Picture and sound together — this may take a moment…'
                : 'Putting your observations together — this may take a moment…'}
            </p>
          </div>
        );

      case 'results':
        return result && <SymptomResults result={result} onClose={handleClose} />;

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h2 className="text-lg font-semibold mt-6">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (path === 'video-first' && pendingVideo) {
                    setStep('questions');
                  } else if (path === 'bundle-first') {
                    setStep('questions');
                  } else {
                    setStep('directed');
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            🔍 {FEATURE_NAME}
          </h1>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <span>✕</span>
          </Button>
        </div>
        <div className="bg-card rounded-lg border shadow-sm">{renderStep()}</div>
      </div>
    </div>
  );
}
