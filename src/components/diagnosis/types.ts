import type { DtcCategory } from "@/data/dtcCodes";
import type { ToolItem } from "@/data/toolsLibrary";

export interface Diagnosis {
  title: string;
  code: string;
  urgency: "low" | "medium" | "high";
  whats_happening: string;
  common_causes: string[];
  diy_feasibility: "easy" | "moderate" | "advanced";
  diy_cost: string;
  diy_time?: string;
  shop_parts_cost?: string;
  shop_labor_cost?: string;
  shop_cost: string;
  shop_time?: string;
  diy_parts?: string[];
  diy_steps_by_part?: { part_name: string; steps: string[] }[];
  category?: DtcCategory;
  tools_required?: ToolItem[];
}

export interface DiagnosisResultProps {
  codes?: string;
  symptom?: string;
  year?: string;
  make?: string;
  model?: string;
  onSwitchToDtc?: () => void;
}
