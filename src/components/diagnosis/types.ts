export interface Diagnosis {
  title: string;
  code: string;
  urgency: "low" | "medium" | "high";
  whats_happening: string;
  common_causes: string[];
  diy_feasibility: "easy" | "moderate" | "advanced";
  diy_cost: string;
  shop_cost: string;
}

export interface DiagnosisResultProps {
  codes?: string;
  symptom?: string;
  year?: string;
  make?: string;
  model?: string;
  onSwitchToDtc?: () => void;
}
