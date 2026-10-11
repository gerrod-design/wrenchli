import { useState } from 'react';
import type { SenseBundle, SymptomAnalysisResponse } from '@/types/symptom';
import { SenseIntakeFlow } from './SenseIntakeFlow';
import { DirectedVideoPrompt } from './DirectedVideoPrompt';
import { SymptomResults } from './SymptomResults';
import VideoCapture from '@/components/capture/VideoCapture';
import { uploadSymptomVideo } from '@/lib/symptomUpload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SymptomFlowModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: SymptomAnalysisResponse, bundle: SenseBundle) => void;
}

type Step = 'intake' | 'directed' | 'recording' | 'uploading' | 'results' | 'error';

export function SymptomFlowModal({ open, onClose, onResult }: SymptomFlowModalProps) {
  const [step, setStep] = useState<Step>('intake');
  const [bundle, setBundle] = useState<SenseBundle | null>(null);
  const [result, setResult] = useState<SymptomAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoComplete = async (blob: Blob | File) => {
    setStep('uploading');
    
    try {
      const file = blob instanceof File 
        ? blob 
        : new File([blob], 'symptom-video.webm', { type: blob.type });
      
      const analysisResult = await uploadSymptomVideo({
        videoFile: file,
        bundle: bundle!,
      });
      
      setResult(analysisResult);
      setStep('results');
      onResult(analysisResult, bundle!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('intake');
    setBundle(null);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            🔍 Symptom Report
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="text-xl">✕</span>
          </Button>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg border shadow-sm">
          {step === 'intake' && (
            <SenseIntakeFlow
              onComplete={(b) => {
                setBundle(b);
                setStep('directed');
              }}
              onCancel={handleClose}
            />
          )}

          {step === 'directed' && bundle && (
            <DirectedVideoPrompt
              bundle={bundle}
              onStartRecording={() => setStep('recording')}
              onBack={() => setStep('intake')}
            />
          )}

          {step === 'recording' && (
            <VideoCapture
              mode="symptom"
          onCaptured={handleVideoComplete}
              onCancel={() => setStep('directed')}
            />
          )}

          {step === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 mb-6">
                <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Analyzing your video</h2>
              <p className="text-muted-foreground max-w-md">
                Picture and sound together — this may take a moment…
              </p>
            </div>
          )}

          {step === 'results' && result && (
            <SymptomResults result={result} onClose={handleClose} />
          )}

          {step === 'error' && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-destructive/10">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {error || 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button
                  onClick={() => setStep('directed')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
