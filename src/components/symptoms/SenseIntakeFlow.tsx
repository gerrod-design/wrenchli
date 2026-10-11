// src/components/symptoms/SenseIntakeFlow.tsx
import { useState, useMemo } from 'react';
import type { SenseObservation, SenseBundle, SenseType } from '@/types/symptom';
import { TIMING_CHIPS, CONDITION_CHIPS, LOCATION_CHIPS, SENSE_ORDER } from '@/data/senseChips';
import { Button } from '@/components/ui/button';
import { SenseCard } from './SenseCard';
import { ChipGrid } from './ChipGrid';
import { buildSenseBundle } from '@/lib/symptomBundleBuilder';

export interface SenseIntakeFlowProps {
  onComplete: (bundle: SenseBundle) => void;
  onCancel: () => void;
}

export function SenseIntakeFlow({ onComplete, onCancel }: SenseIntakeFlowProps) {
  const [observations, setObservations] = useState<SenseObservation[]>(
    SENSE_ORDER.map((sense) => ({
      sense,
      descriptors: [],
      freeText: '',
    }))
  );
  const [timing, setTiming] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const handleObservationChange = (sense: SenseType, obs: SenseObservation) => {
    setObservations((prev) =>
      prev.map((o) => (o.sense === sense ? obs : o))
    );
  };

  const handleTimingToggle = (value: string) => {
    setTiming((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleConditionToggle = (value: string) => {
    setConditions((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleLocationToggle = (value: string) => {
    setLocations((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]
    );
  };

  const canContinue = useMemo(() => {
    return observations.some(
      (obs) => obs.descriptors.length > 0 || !!obs.freeText
    );
  }, [observations]);

  const handleContinue = () => {
    const bundle = buildSenseBundle(observations, timing, conditions, locations);
    onComplete(bundle);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="flex-1 space-y-6 p-4 max-w-2xl mx-auto w-full">
        {SENSE_ORDER.map((sense) => {
          const observation = observations.find((o) => o.sense === sense)!;
          return (
            <SenseCard
              key={sense}
              sense={sense}
              observation={observation}
              onChange={(obs) => handleObservationChange(sense, obs)}
            />
          );
        })}

        <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">When did you notice it?</h3>
            <ChipGrid
              options={TIMING_CHIPS}
              selected={timing}
              onToggle={handleTimingToggle}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">When does it happen?</h3>
            <ChipGrid
              options={CONDITION_CHIPS}
              selected={conditions}
              onToggle={handleConditionToggle}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Where?</h3>
            <ChipGrid
              options={LOCATION_CHIPS}
              selected={locations}
              onToggle={handleLocationToggle}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
