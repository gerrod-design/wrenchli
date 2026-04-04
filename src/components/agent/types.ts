// Types for the Agent Platform consumer flow
export interface AgentDiagnosis {
  primaryDiagnosis: string;
  primaryConfidence: number;
  rationale: string;
  alternativeDiagnoses: AlternativeDiagnosis[];
  costEstimate: CostEstimate;
  recommendedAction: string;
  urgency: "low" | "medium" | "high";
  confidenceWarning?: string | null;
  trackingNumber?: string;
  historicalData?: HistoricalData;
}

export interface AlternativeDiagnosis {
  diagnosis: string;
  probability: number;
  rationale: string;
}

export interface CostEstimate {
  min: number;
  max: number;
  breakdown: string;
}

export interface HistoricalData {
  totalCases: number;
  similarSymptoms: number;
  mostCommonDiagnosis: string;
  successRate: number;
}

export interface RankedShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  isPartnered: boolean;
  isDealer: boolean;
  priceTier: string;
  metrics: ShopMetrics;
  score: number;
  rankingReasons: string[];
}

export interface ShopMetrics {
  successRate: number | null;
  totalJobs: number;
  avgSatisfaction: number | null;
  avgCost: number | null;
  reworkRate: number | null;
  turnaroundDays: number | null;
}

export interface PriceApproval {
  estimatedCost: number;
  breakdown: string;
  marketAverage: number | null;
  variancePercent: number | null;
  lowestInArea: number | null;
  highestInArea: number | null;
  fairnessLabel: "BELOW_MARKET" | "FAIR" | "ABOVE_MARKET" | "SIGNIFICANTLY_ABOVE";
}

export interface RepairOutcomeInput {
  diagnosisRecordId: string;
  shopActualDiagnosis?: string;
  shopActualCost?: number;
  shopPartsUsed?: string;
  shopNotes?: string;
  customerSatisfaction?: number;
  customerWouldReturn?: boolean;
  customerIssuesSinceRepair?: boolean;
  customerFeedback?: string;
}

export type FlowStep = "symptoms" | "diagnosis" | "shop_selection" | "price_approval" | "booking" | "outcome";
