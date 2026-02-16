/**
 * Standard vehicle maintenance schedule data.
 * Used to generate proactive reminders based on mileage.
 */

export interface MaintenanceItem {
  type: string;
  label: string;
  intervalMiles: number;
  intervalMonths: number;
  estimatedCostLow: number;
  estimatedCostHigh: number;
  priority: "essential" | "recommended" | "optional";
  description: string;
}

export const MAINTENANCE_SCHEDULE: MaintenanceItem[] = [
  {
    type: "oil_change",
    label: "Oil Change",
    intervalMiles: 5000,
    intervalMonths: 6,
    estimatedCostLow: 30,
    estimatedCostHigh: 75,
    priority: "essential",
    description: "Replace engine oil and filter to maintain engine health.",
  },
  {
    type: "tire_rotation",
    label: "Tire Rotation",
    intervalMiles: 7500,
    intervalMonths: 12,
    estimatedCostLow: 25,
    estimatedCostHigh: 50,
    priority: "recommended",
    description: "Even out tire wear for longer tire life and better handling.",
  },
  {
    type: "brake_inspection",
    label: "Brake Inspection",
    intervalMiles: 15000,
    intervalMonths: 12,
    estimatedCostLow: 0,
    estimatedCostHigh: 50,
    priority: "essential",
    description: "Check brake pad thickness, rotors, and fluid level.",
  },
  {
    type: "air_filter",
    label: "Engine Air Filter",
    intervalMiles: 15000,
    intervalMonths: 24,
    estimatedCostLow: 15,
    estimatedCostHigh: 40,
    priority: "recommended",
    description: "Replace engine air filter for optimal fuel efficiency.",
  },
  {
    type: "cabin_filter",
    label: "Cabin Air Filter",
    intervalMiles: 15000,
    intervalMonths: 12,
    estimatedCostLow: 15,
    estimatedCostHigh: 35,
    priority: "optional",
    description: "Replace cabin air filter for clean air inside the vehicle.",
  },
  {
    type: "transmission_service",
    label: "Transmission Service",
    intervalMiles: 60000,
    intervalMonths: 60,
    estimatedCostLow: 150,
    estimatedCostHigh: 400,
    priority: "essential",
    description: "Replace transmission fluid to protect internal components.",
  },
  {
    type: "coolant_flush",
    label: "Coolant Flush",
    intervalMiles: 30000,
    intervalMonths: 36,
    estimatedCostLow: 100,
    estimatedCostHigh: 200,
    priority: "recommended",
    description: "Replace coolant to prevent overheating and corrosion.",
  },
  {
    type: "spark_plugs",
    label: "Spark Plug Replacement",
    intervalMiles: 60000,
    intervalMonths: 60,
    estimatedCostLow: 100,
    estimatedCostHigh: 300,
    priority: "essential",
    description: "Replace spark plugs for proper combustion and fuel economy.",
  },
  {
    type: "battery_check",
    label: "Battery Check",
    intervalMiles: 30000,
    intervalMonths: 24,
    estimatedCostLow: 0,
    estimatedCostHigh: 25,
    priority: "recommended",
    description: "Test battery health and clean terminals.",
  },
  {
    type: "serpentine_belt",
    label: "Serpentine Belt",
    intervalMiles: 60000,
    intervalMonths: 60,
    estimatedCostLow: 100,
    estimatedCostHigh: 200,
    priority: "essential",
    description: "Inspect and replace serpentine belt to prevent breakdowns.",
  },
];

export interface UpcomingMaintenance {
  type: string;
  label: string;
  dueMileage: number;
  milesUntilDue: number;
  estimatedCostLow: number;
  estimatedCostHigh: number;
  priority: "overdue" | "urgent" | "soon" | "upcoming";
  description: string;
}

/**
 * Calculate upcoming maintenance based on current mileage and last services.
 */
export function getUpcomingMaintenance(
  currentMileage: number,
  lastServices: { type: string; mileage: number }[] = []
): UpcomingMaintenance[] {
  return MAINTENANCE_SCHEDULE.map((item) => {
    const lastService = lastServices.find((s) => s.type === item.type);
    const lastMileage = lastService?.mileage ?? 0;
    const dueMileage = lastMileage + item.intervalMiles;
    const milesUntilDue = dueMileage - currentMileage;

    let priority: UpcomingMaintenance["priority"];
    if (milesUntilDue < 0) priority = "overdue";
    else if (milesUntilDue <= 1000) priority = "urgent";
    else if (milesUntilDue <= 3000) priority = "soon";
    else priority = "upcoming";

    return {
      type: item.type,
      label: item.label,
      dueMileage,
      milesUntilDue,
      estimatedCostLow: item.estimatedCostLow,
      estimatedCostHigh: item.estimatedCostHigh,
      priority,
      description: item.description,
    };
  })
    .filter((m) => m.milesUntilDue <= 5000) // Only show items due within 5k miles
    .sort((a, b) => a.milesUntilDue - b.milesUntilDue);
}
