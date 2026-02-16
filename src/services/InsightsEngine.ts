import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  current_mileage?: number;
  driving_style?: string;
  usage_type?: string;
  annual_mileage_estimate?: number;
  location_zip?: string;
  created_at?: string;
}

export interface ProactiveInsight {
  id: string;
  vehicle_id: string;
  type: "maintenance" | "market_timing" | "problem_prevention" | "financial_planning" | "recall";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string;
  action_items: string[];
  cost_to_ignore?: number;
  potential_savings?: number;
  urgency_timeframe?: string;
  market_data?: {
    similar_vehicles_affected?: number;
    average_repair_cost?: number;
    success_rate_if_preventive?: number;
  };
  created_at: string;
  expires_at?: string;
  is_dismissed: boolean;
}

interface MaintenanceSchedule {
  service_type: string;
  due_mileage: number;
  cost_range: { min: number; max: number };
  urgency: "overdue" | "due_soon" | "coming_up" | "future";
  description: string;
}

interface MarketAnalysis {
  current_value: number;
  value_trend: "up" | "down" | "stable";
  trend_percentage: number;
  optimal_trade_window?: string;
  market_conditions: string;
}

interface ReliabilityAlert {
  issue_type: string;
  probability: number;
  typical_mileage_range: { min: number; max: number };
  preventive_cost: number;
  repair_cost: number;
  market_data: {
    affected_percentage: number;
    reports_count: number;
  };
}

export class InsightsEngine {
  static async generateInsights(vehicle: Vehicle): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      const maintenanceInsights = await this.generateMaintenanceInsights(vehicle);
      insights.push(...maintenanceInsights);

      const marketInsights = await this.generateMarketInsights(vehicle);
      insights.push(...marketInsights);

      const reliabilityInsights = await this.generateReliabilityInsights(vehicle);
      insights.push(...reliabilityInsights);

      const financialInsights = await this.generateFinancialInsights(vehicle);
      insights.push(...financialInsights);

      return insights.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }

  private static async generateMaintenanceInsights(vehicle: Vehicle): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const currentMileage = vehicle.current_mileage || 0;
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const maintenanceSchedule = this.getMaintenanceSchedule(vehicle.make, currentMileage, vehicleAge);

    maintenanceSchedule.forEach((maintenance) => {
      if (maintenance.urgency === "due_soon" || maintenance.urgency === "overdue") {
        insights.push({
          id: `maintenance_${maintenance.service_type.replace(/\s+/g, "_").toLowerCase()}_${vehicle.id}`,
          vehicle_id: vehicle.id,
          type: "maintenance",
          priority: maintenance.urgency === "overdue" ? "high" : "medium",
          title: `${maintenance.service_type} ${maintenance.urgency === "overdue" ? "Overdue" : "Due Soon"}`,
          description: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} needs ${maintenance.description}. ${
            maintenance.urgency === "overdue"
              ? "This service is overdue and should be completed immediately."
              : "This should be completed within the next 1,000 miles or 30 days."
          }`,
          action_items: [
            "Find local service providers",
            "Schedule appointment",
            "Budget for service cost",
          ],
          cost_to_ignore: maintenance.cost_range.max * 2,
          potential_savings: maintenance.cost_range.max - maintenance.cost_range.min,
          urgency_timeframe: maintenance.urgency === "overdue" ? "immediately" : "next 30 days",
          created_at: new Date().toISOString(),
          is_dismissed: false,
        });
      }
    });

    return insights;
  }

  private static async generateMarketInsights(vehicle: Vehicle): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const marketAnalysis = await this.getMarketAnalysis(vehicle);
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const currentMileage = vehicle.current_mileage || 0;

    if (vehicleAge >= 5 && vehicleAge <= 8 && currentMileage < 100000) {
      insights.push({
        id: `market_timing_${vehicle.id}`,
        vehicle_id: vehicle.id,
        type: "market_timing",
        priority: "medium",
        title: "Optimal Trade-In Window",
        description: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is in the optimal trade-in window. Current estimated value: $${marketAnalysis.current_value.toLocaleString()}. Vehicle values typically decline more rapidly after 8 years or 100,000 miles.`,
        action_items: [
          "Research replacement options",
          "Get trade-in quotes",
          "Compare financing options",
          "Monitor market trends",
        ],
        urgency_timeframe: "next 12-18 months",
        created_at: new Date().toISOString(),
        is_dismissed: false,
      });
    }

    if (marketAnalysis.value_trend === "up" && marketAnalysis.trend_percentage > 5) {
      insights.push({
        id: `value_increase_${vehicle.id}`,
        vehicle_id: vehicle.id,
        type: "market_timing",
        priority: "low",
        title: "Market Value Increasing",
        description: `Great news! Your ${vehicle.year} ${vehicle.make} ${vehicle.model} has increased in value by ${marketAnalysis.trend_percentage.toFixed(1)}% this month. Current market conditions are favorable for this model.`,
        action_items: [
          "Consider trading up if looking for a change",
          "Maintain vehicle well to preserve value",
          "Keep maintenance records updated",
        ],
        created_at: new Date().toISOString(),
        is_dismissed: false,
      });
    }

    return insights;
  }

  private static async generateReliabilityInsights(vehicle: Vehicle): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const reliabilityAlerts = this.getReliabilityAlerts(vehicle);

    reliabilityAlerts.forEach((alert) => {
      const currentMileage = vehicle.current_mileage || 0;
      const isInRiskRange =
        currentMileage >= alert.typical_mileage_range.min &&
        currentMileage <= alert.typical_mileage_range.max + 20000;

      if (isInRiskRange && alert.probability > 0.4) {
        insights.push({
          id: `reliability_${alert.issue_type.replace(/\s+/g, "_").toLowerCase()}_${vehicle.id}`,
          vehicle_id: vehicle.id,
          type: "problem_prevention",
          priority: alert.probability > 0.6 ? "high" : "medium",
          title: `Potential ${alert.issue_type} Issue`,
          description: `Based on data from ${alert.market_data.reports_count.toLocaleString()} similar vehicles, ${alert.market_data.affected_percentage}% of ${vehicle.year} ${vehicle.make} ${vehicle.model}s experience ${alert.issue_type.toLowerCase()} issues between ${alert.typical_mileage_range.min.toLocaleString()}-${alert.typical_mileage_range.max.toLocaleString()} miles.`,
          action_items: [
            "Schedule preventive inspection",
            "Budget for potential repair",
            "Consider extended warranty",
            "Research common symptoms",
          ],
          cost_to_ignore: alert.repair_cost,
          potential_savings: alert.repair_cost - alert.preventive_cost,
          urgency_timeframe: "next 6 months",
          market_data: {
            similar_vehicles_affected: Math.round(
              (alert.market_data.reports_count * alert.market_data.affected_percentage) / 100
            ),
            average_repair_cost: alert.repair_cost,
            success_rate_if_preventive: 85,
          },
          created_at: new Date().toISOString(),
          is_dismissed: false,
        });
      }
    });

    return insights;
  }

  private static async generateFinancialInsights(vehicle: Vehicle): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const currentMileage = vehicle.current_mileage || 0;

    if (vehicleAge >= 7 || currentMileage > 90000) {
      const estimatedAnnualMaintenance = this.estimateAnnualMaintenanceCost(vehicle);

      insights.push({
        id: `financial_planning_${vehicle.id}`,
        vehicle_id: vehicle.id,
        type: "financial_planning",
        priority: "medium",
        title: "Entering High-Maintenance Phase",
        description: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is entering the high-maintenance phase. Expect annual maintenance costs of approximately $${estimatedAnnualMaintenance.toLocaleString()}. Consider setting aside $${Math.round(estimatedAnnualMaintenance / 12)}/month for repairs.`,
        action_items: [
          "Create repair budget",
          "Research extended warranty options",
          "Consider replacement timeline",
          "Maintain emergency repair fund",
        ],
        potential_savings: Math.round(estimatedAnnualMaintenance * 0.3),
        urgency_timeframe: "ongoing",
        created_at: new Date().toISOString(),
        is_dismissed: false,
      });
    }

    return insights;
  }

  private static getMaintenanceSchedule(
    make: string,
    mileage: number,
    _age: number
  ): MaintenanceSchedule[] {
    const schedule: MaintenanceSchedule[] = [];

    const oilInterval = ["Honda", "Toyota", "Mazda"].includes(make) ? 7500 : 5000;
    const lastOilChange = Math.floor(mileage / oilInterval) * oilInterval;
    const nextOilChange = lastOilChange + oilInterval;

    if (mileage > nextOilChange) {
      schedule.push({
        service_type: "Oil Change",
        due_mileage: nextOilChange,
        cost_range: { min: 35, max: 80 },
        urgency: "overdue",
        description: "engine oil and filter replacement",
      });
    } else if (mileage > nextOilChange - 500) {
      schedule.push({
        service_type: "Oil Change",
        due_mileage: nextOilChange,
        cost_range: { min: 35, max: 80 },
        urgency: "due_soon",
        description: "engine oil and filter replacement",
      });
    }

    const transInterval = ["Honda", "Toyota"].includes(make) ? 60000 : 30000;
    if (mileage > 30000 && mileage % transInterval > transInterval - 3000) {
      const nextTransService = Math.ceil(mileage / transInterval) * transInterval;
      schedule.push({
        service_type: "Transmission Service",
        due_mileage: nextTransService,
        cost_range: { min: 200, max: 400 },
        urgency: mileage > nextTransService ? "overdue" : "due_soon",
        description: "transmission fluid and filter change",
      });
    }

    if (mileage > 35000) {
      const estimatedBrakeMileage = 50000;
      const brakeUrgency =
        mileage > estimatedBrakeMileage + 10000
          ? "overdue"
          : mileage > estimatedBrakeMileage - 5000
          ? "due_soon"
          : "coming_up";

      if (brakeUrgency !== "coming_up") {
        schedule.push({
          service_type: "Brake Inspection",
          due_mileage: estimatedBrakeMileage,
          cost_range: { min: 300, max: 800 },
          urgency: brakeUrgency,
          description: "brake pad and rotor inspection/replacement",
        });
      }
    }

    return schedule;
  }

  private static async getMarketAnalysis(vehicle: Vehicle): Promise<MarketAnalysis> {
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const currentMileage = vehicle.current_mileage || 0;

    let baseValue = 30000;
    if (["Honda", "Toyota", "Mazda"].includes(vehicle.make)) baseValue = 28000;
    if (["BMW", "Mercedes-Benz", "Audi"].includes(vehicle.make)) baseValue = 45000;

    const ageDepreciation = baseValue * Math.min(vehicleAge * 0.15, 0.8);
    const mileageDepreciation = (currentMileage - vehicleAge * 12000) * 0.15;
    const currentValue = Math.max(baseValue - ageDepreciation - mileageDepreciation, 2000);

    const trendPercentage = (Math.random() - 0.5) * 10;

    return {
      current_value: Math.round(currentValue),
      value_trend: trendPercentage > 1 ? "up" : trendPercentage < -1 ? "down" : "stable",
      trend_percentage: Math.abs(trendPercentage),
      optimal_trade_window:
        vehicleAge >= 5 && vehicleAge <= 8 ? "next 12-18 months" : undefined,
      market_conditions: trendPercentage > 0 ? "favorable" : "challenging",
    };
  }

  private static getReliabilityAlerts(vehicle: Vehicle): ReliabilityAlert[] {
    const reliabilityDatabase: Record<
      string,
      {
        issue_type: string;
        mileage_range: { min: number; max: number };
        probability: number;
        preventive_cost: number;
        repair_cost: number;
        affected_percentage: number;
      }[]
    > = {
      Honda: [
        {
          issue_type: "Transmission",
          mileage_range: { min: 80000, max: 120000 },
          probability: 0.15,
          preventive_cost: 400,
          repair_cost: 3500,
          affected_percentage: 12,
        },
      ],
      BMW: [
        {
          issue_type: "Cooling System",
          mileage_range: { min: 60000, max: 100000 },
          probability: 0.45,
          preventive_cost: 600,
          repair_cost: 2500,
          affected_percentage: 38,
        },
        {
          issue_type: "Electrical System",
          mileage_range: { min: 70000, max: 150000 },
          probability: 0.35,
          preventive_cost: 300,
          repair_cost: 1800,
          affected_percentage: 28,
        },
      ],
      Ford: [
        {
          issue_type: "Transmission",
          mileage_range: { min: 90000, max: 140000 },
          probability: 0.25,
          preventive_cost: 350,
          repair_cost: 4000,
          affected_percentage: 22,
        },
      ],
      Nissan: [
        {
          issue_type: "CVT Transmission",
          mileage_range: { min: 60000, max: 100000 },
          probability: 0.5,
          preventive_cost: 400,
          repair_cost: 4500,
          affected_percentage: 35,
        },
      ],
      "Mercedes-Benz": [
        {
          issue_type: "Transmission Conductor Plate",
          mileage_range: { min: 70000, max: 110000 },
          probability: 0.4,
          preventive_cost: 300,
          repair_cost: 3000,
          affected_percentage: 30,
        },
      ],
    };

    const makeAlerts = reliabilityDatabase[vehicle.make] || [];

    return makeAlerts.map((alert) => ({
      ...alert,
      typical_mileage_range: alert.mileage_range,
      market_data: {
        affected_percentage: alert.affected_percentage,
        reports_count: Math.round((10000 * alert.affected_percentage) / 100),
      },
    }));
  }

  private static estimateAnnualMaintenanceCost(vehicle: Vehicle): number {
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const currentMileage = vehicle.current_mileage || 0;

    let baseCost = 800;

    if (vehicleAge > 10) baseCost *= 2.5;
    else if (vehicleAge > 7) baseCost *= 1.8;
    else if (vehicleAge > 5) baseCost *= 1.4;

    if (currentMileage > 150000) baseCost *= 1.8;
    else if (currentMileage > 100000) baseCost *= 1.4;
    else if (currentMileage > 75000) baseCost *= 1.2;

    if (["Honda", "Toyota", "Mazda"].includes(vehicle.make)) baseCost *= 0.8;
    if (["BMW", "Mercedes-Benz", "Audi", "Jaguar"].includes(vehicle.make)) baseCost *= 1.6;
    if (["Jeep", "Chrysler", "Dodge"].includes(vehicle.make)) baseCost *= 1.3;

    return Math.round(baseCost);
  }

  static async saveInsights(insights: ProactiveInsight[]): Promise<void> {
    try {
      const rows = insights.map((i) => ({
        id: i.id,
        vehicle_id: i.vehicle_id,
        type: i.type,
        priority: i.priority,
        title: i.title,
        description: i.description,
        action_items: i.action_items,
        cost_to_ignore: i.cost_to_ignore ?? null,
        potential_savings: i.potential_savings ?? null,
        urgency_timeframe: i.urgency_timeframe ?? null,
        market_data: i.market_data ?? null,
        is_dismissed: false,
      }));

      const { error } = await supabase
        .from("proactive_insights" as any)
        .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving insights:", error);
      throw error;
    }
  }

  static async getInsightsForVehicle(vehicleId: string): Promise<ProactiveInsight[]> {
    try {
      const { data, error } = await supabase
        .from("proactive_insights" as any)
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        vehicle_id: row.vehicle_id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        description: row.description,
        action_items: row.action_items || [],
        cost_to_ignore: row.cost_to_ignore,
        potential_savings: row.potential_savings,
        urgency_timeframe: row.urgency_timeframe,
        market_data: row.market_data,
        created_at: row.created_at,
        expires_at: row.expires_at,
        is_dismissed: row.is_dismissed,
      }));
    } catch (error) {
      console.error("Error fetching insights:", error);
      return [];
    }
  }
}

export default InsightsEngine;
