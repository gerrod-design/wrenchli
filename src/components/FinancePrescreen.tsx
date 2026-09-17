import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  Car,
  Info,
} from "lucide-react";

interface RepairAnalysis {
  recommendation: "repair" | "replace" | "consider_both";
  repairCostRatio: number;
  monthsOfValue: number;
  replacementOptions?: {
    estimatedVehicleValue: number;
    replacementCost: number;
    monthlyPaymentDifference: number;
  };
}

const analyzeRepairDecision = (
  repairCost: number,
  vehicleData: any
): RepairAnalysis => {
  const vehicleValue = vehicleData?.estimatedValue || repairCost * 2;
  const vehicleAge = vehicleData?.age || 8;
  const repairCostRatio = repairCost / vehicleValue;

  let recommendation: "repair" | "replace" | "consider_both";
  let monthsOfValue: number;

  if (repairCostRatio < 0.3 && vehicleAge < 10) {
    recommendation = "repair";
    monthsOfValue = 24;
  } else if (repairCostRatio > 0.6 || vehicleAge > 12) {
    recommendation = "replace";
    monthsOfValue = 6;
  } else {
    recommendation = "consider_both";
    monthsOfValue = 12;
  }

  return {
    recommendation,
    repairCostRatio,
    monthsOfValue,
    replacementOptions: {
      estimatedVehicleValue: vehicleValue,
      replacementCost: vehicleValue * 2.5,
      monthlyPaymentDifference: 150,
    },
  };
};

const RepairVsReplaceAnalysis = ({
  repairCost,
  analysis,
}: {
  repairCost: number;
  vehicleData: any;
  analysis: RepairAnalysis;
}) => {
  if (analysis.recommendation === "repair") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h3 className="font-heading text-lg font-semibold text-green-800">
            Repair Recommended
          </h3>
        </div>
        <p className="text-green-700 mb-3">
          This repair costs {Math.round(analysis.repairCostRatio * 100)}% of
          your vehicle's estimated value. It's a smart investment that should
          give you {analysis.monthsOfValue} more months of reliable
          transportation.
        </p>
        <div className="flex items-center gap-4 text-sm text-green-600">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>Cost effective</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{analysis.monthsOfValue} months expected use</span>
          </div>
        </div>
      </div>
    );
  }

  if (analysis.recommendation === "replace") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <h3 className="font-heading text-lg font-semibold text-amber-800">
            Consider Replacement
          </h3>
        </div>
        <p className="text-amber-700 mb-3">
          This repair costs {Math.round(analysis.repairCostRatio * 100)}% of
          your vehicle's value. You might get better long-term value by
          upgrading to a newer vehicle.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800">If you repair:</p>
            <p className="text-2xl font-bold text-amber-600">
              ${repairCost.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600">
              ~{analysis.monthsOfValue} months expected use
            </p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800">
              If you replace:
            </p>
            <p className="text-2xl font-bold text-amber-600">
              $
              {analysis.replacementOptions?.monthlyPaymentDifference || 150}
              /mo
            </p>
            <p className="text-xs text-amber-600">
              New car payment difference
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <Car className="h-4 w-4 mr-2" />
          Explore Vehicle Options
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-center gap-3 mb-3">
        <Info className="h-6 w-6 text-blue-600" />
        <h3 className="font-heading text-lg font-semibold text-blue-800">
          Both Options Worth Considering
        </h3>
      </div>
      <p className="text-blue-700 mb-3">
        This repair costs {Math.round(analysis.repairCostRatio * 100)}% of your
        vehicle's value. Compare the numbers and decide what works best for your
        situation.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-white rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800">Repair Option:</p>
          <p className="text-xl font-bold text-blue-600">
            ${repairCost.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600">Keep current vehicle</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800">Replace Option:</p>
          <p className="text-xl font-bold text-blue-600">
            +$
            {analysis.replacementOptions?.monthlyPaymentDifference || 150}
            /mo
          </p>
          <p className="text-xs text-blue-600">Upgrade to newer vehicle</p>
        </div>
      </div>
    </div>
  );
};

// NOTE (2026-09-17): Wrenchli does not offer financing. The previous version of
// this component rendered fabricated lender options (Klarna, Affirm, Capital One,
// credit unions) with invented approval rates and collected SSN fragments via a
// non-functional "prescreen" form. All of that has been removed. Financing is
// described only as "repair financing on the way" per the product rulebook.
const FinancePrescreen = ({
  repairCost,
  vehicleData,
}: {
  repairCost: number;
  vehicleData: any;
  onFinanceSelected?: (option: unknown) => void;
}) => {
  const repairAnalysis = analyzeRepairDecision(repairCost, vehicleData);

  return (
    <div className="space-y-6">
      <RepairVsReplaceAnalysis
        repairCost={repairCost}
        vehicleData={vehicleData}
        analysis={repairAnalysis}
      />

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-bold">Financing Options</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Repair financing is on the way. We&apos;ll let you know when
          payment options are available through Wrenchli.
        </p>
      </div>
    </div>
  );
};

export default FinancePrescreen;
