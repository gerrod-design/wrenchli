// src/components/symptoms/SenseCard.tsx
import { useState } from 'react';
import type { SenseType, SenseObservation } from '@/types/symptom';
import { SENSE_CHIPS, SENSE_LABELS, SENSE_ICONS } from '@/data/senseChips';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChipGrid } from './ChipGrid';

export interface SenseCardProps {
  sense: SenseType;
  observation: SenseObservation;
  onChange: (obs: SenseObservation) => void;
}

export function SenseCard({ sense, observation, onChange }: SenseCardProps) {
  const [showFreeText, setShowFreeText] = useState(false);
  
  const hasContent = observation.descriptors.length > 0 || !!observation.freeText;
  
  const handleToggle = (value: string) => {
    const newDescriptors = observation.descriptors.includes(value)
      ? observation.descriptors.filter((d) => d !== value)
      : [...observation.descriptors, value];
    
    onChange({
      ...observation,
      descriptors: newDescriptors,
    });
  };
  
  const handleFreeTextChange = (value: string) => {
    onChange({
      ...observation,
      freeText: value,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{SENSE_ICONS[sense]}</span>
          <span>{SENSE_LABELS[sense]}</span>
        </h3>
        {hasContent && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
      
      <ChipGrid
        options={SENSE_CHIPS[sense]}
        selected={observation.descriptors}
        onToggle={handleToggle}
      />
      
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowFreeText(!showFreeText)}
          className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
        >
          {showFreeText ? '− ' : '+ '}Something else
        </Button>
        
        {showFreeText && (
          <input
            type="text"
            placeholder="Describe anything else you notice..."
            value={observation.freeText || ''}
            onChange={(e) => handleFreeTextChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        )}
      </div>
    </div>
  );
}
