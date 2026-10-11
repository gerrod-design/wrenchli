export type SenseType = 'SEE' | 'HEAR' | 'SMELL' | 'FEEL';

export type TimingDescriptor =
  | 'just started'
  | 'hours ago'
  | 'days ago'
  | 'weeks ago'
  | 'worse in the morning'
  | 'worse when engine is hot';

export type ConditionDescriptor =
  | 'when braking'
  | 'when accelerating'
  | 'at idle'
  | 'over bumps'
  | 'turning'
  | 'at highway speed'
  | 'cold start';

export type LocationDescriptor =
  | 'front'
  | 'rear'
  | 'left side'
  | 'right side'
  | 'under the hood'
  | 'inside the cabin'
  | 'near a wheel';

export interface SenseObservation {
  sense: SenseType;
  descriptors: string[];
  freeText?: string;
}

export interface SenseBundle {
  observations: SenseObservation[];
  timing: TimingDescriptor[];
  conditions: ConditionDescriptor[];
  locations: LocationDescriptor[];
  vehicleContext?: {
    year?: string;
    make?: string;
    model?: string;
    mileage?: string;
  };
  timestamp: string;
}

export type UrgencyTier = 1 | 2 | 3;

export interface SymptomAnalysisResponse {
  urgency: UrgencyTier;
  urgencyReason?: string;
  systemAreas: string[];
  shopLanguageSummary: string;
  preliminaryAssessment: string;
  videoInsights?: string;
  sensesCovered: SenseType[];
  frameCount: number;
  hasAudio: boolean;
}
