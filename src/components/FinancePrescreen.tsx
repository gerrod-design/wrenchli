import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Calculator,
  TrendingUp,
  Car,
  Building,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";

interface FinanceOption {
  id: string;
  provider: string;
  type: "bnpl" | "traditional" | "credit_union";
  logo?: string;
  apr: number;
  monthlyPayment: number;
  term: number;
  totalCost: number;
  qualificationRequirement: string;
  approvalRate: string;
  features: string[];
  badge?: string;
  color: string;
}

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

interface CustomerPrescreen {
  creditTier?: "excellent" | "good" | "fair" | "building";
  estimatedApproval?: boolean;
  preferredOptions?: string[];
}

const generateFinanceOptions = (
  repairCost: number,
  _customerPrescreen?: CustomerPrescreen
): FinanceOption[] => {
  const options: FinanceOption[] = [];

  // BNPL Options (for repairs under $1,500)
  if (repairCost <= 1500) {
    options.push({
      id: "klarna-4pay",
      provider: "Klarna",
      type: "bnpl",
      apr: 0,
      monthlyPayment: repairCost / 4,
      term: 2,
      totalCost: repairCost,
      qualificationRequirement: "Soft credit check",
      approvalRate: "85%",
      features: ["No interest", "4 payments", "Instant approval"],
      badge: "Most Popular",
      color: "bg-pink-500",
    });

    options.push({
      id: "affirm-short",
      provider: "Affirm",
      type: "bnpl",
      apr: 0,
      monthlyPayment: repairCost / 3,
      term: 3,
      totalCost: repairCost,
      qualificationRequirement: "Soft credit check",
      approvalRate: "80%",
      features: ["0% APR", "3 monthly payments", "No late fees"],
      color: "bg-blue-500",
    });
  }

  // Medium-term options ($300 - $5,000)
  if (repairCost >= 300 && repairCost <= 5000) {
    const monthlyPayment12 = (repairCost * 1.08) / 12;
    const monthlyPayment24 = (repairCost * 1.16) / 24;

    options.push({
      id: "affirm-12mo",
      provider: "Affirm",
      type: "traditional",
      apr: 7.99,
      monthlyPayment: monthlyPayment12,
      term: 12,
      totalCost: repairCost * 1.08,
      qualificationRequirement: "Good credit (640+)",
      approvalRate: "70%",
      features: ["Fixed rate", "No prepayment penalty", "Easy application"],
      color: "bg-blue-500",
    });

    options.push({
      id: "capital-one",
      provider: "Capital One",
      type: "traditional",
      apr: 6.99,
      monthlyPayment: monthlyPayment24,
      term: 24,
      totalCost: repairCost * 1.16,
      qualificationRequirement: "Existing customer preferred",
      approvalRate: "65%",
      features: [
        "Bank relationship benefits",
        "Competitive rates",
        "Existing customer perks",
      ],
      badge: "Existing Customers",
      color: "bg-red-600",
    });
  }

  // Large repairs ($2,000+) - Add credit union options
  if (repairCost >= 2000) {
    const monthlyPayment36 = (repairCost * 1.18) / 36;

    options.push({
      id: "dfcu-repair",
      provider: "DFCU Financial",
      type: "credit_union",
      apr: 5.99,
      monthlyPayment: monthlyPayment36,
      term: 36,
      totalCost: repairCost * 1.18,
      qualificationRequirement: "Michigan residents",
      approvalRate: "75%",
      features: ["Local credit union", "Lowest rates", "Community focused"],
      badge: "Best Rate",
      color: "bg-green-600",
    });

    options.push({
      id: "michigan-first",
      provider: "Michigan First CU",
      type: "credit_union",
      apr: 6.49,
      monthlyPayment: (repairCost * 1.2) / 36,
      term: 36,
      totalCost: repairCost * 1.2,
      qualificationRequirement: "Membership available",
      approvalRate: "80%",
      features: ["Easy membership", "Personal service", "Local branches"],
      color: "bg-green-600",
    });
  }

  return options.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
};

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

const FinanceOptionCard = ({
  option,
  selected,
  onSelect,
}: {
  option: FinanceOption;
  selected: boolean;
  onSelect: () => void;
}) => {
  const getProviderIcon = () => {
    switch (option.provider) {
      case "Klarna":
        return <CreditCard className="h-5 w-5 text-pink-500" />;
      case "Affirm":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "Capital One":
        return <Building className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-card hover:border-accent/50"
      }`}
      onClick={onSelect}
    >
      {option.badge && (
        <Badge className="absolute -top-2 left-4 bg-accent text-accent-foreground">
          {option.badge}
        </Badge>
      )}

      <div className="flex items-start gap-3">
        {getProviderIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-semibold">{option.provider}</h3>
            <Badge variant="outline" className="text-xs">
              {option.type === "bnpl"
                ? "Buy Now Pay Later"
                : option.type === "credit_union"
                ? "Credit Union"
                : "Bank"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-2xl font-bold text-accent">
                ${Math.round(option.monthlyPayment).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {option.term} {option.term === 2 ? "payments" : "months"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {option.apr === 0 ? "No Interest" : `${option.apr}% APR`}
              </p>
              <p className="text-xs text-muted-foreground">
                Total: ${Math.round(option.totalCost).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-1 mb-3">
            {option.features.slice(0, 2).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                <span className="text-xs text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {option.qualificationRequirement}
            </span>
            <span className="font-medium text-green-600">
              {option.approvalRate} approval rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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

const PrescreenForm = ({
  onComplete,
}: {
  onComplete: (data: CustomerPrescreen) => void;
}) => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    ssn4: "",
    income: "",
    employmentStatus: "employed",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      creditTier: "good",
      estimatedApproval: true,
      preferredOptions: ["klarna-4pay", "affirm-12mo"],
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-semibold mb-3">
        Quick Prescreen for Better Rates
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Soft credit check - no impact on your credit score
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Email address"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />
        <Input
          placeholder="Phone number"
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
        <Input
          placeholder="Last 4 digits of SSN"
          maxLength={4}
          value={formData.ssn4}
          onChange={(e) =>
            setFormData({
              ...formData,
              ssn4: e.target.value.replace(/\D/g, ""),
            })
          }
        />
        <Input
          placeholder="Monthly income (optional)"
          value={formData.income}
          onChange={(e) =>
            setFormData({ ...formData, income: e.target.value })
          }
        />
        <Button type="submit" className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Check My Options
        </Button>
      </form>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Soft inquiry only — your credit score won't be affected
      </p>
    </div>
  );
};

const FinancePrescreen = ({
  repairCost,
  vehicleData,
  onFinanceSelected,
}: {
  repairCost: number;
  vehicleData: any;
  onFinanceSelected: (option: FinanceOption) => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customerPrescreen, setCustomerPrescreen] =
    useState<CustomerPrescreen | null>(null);
  const [showPrescreen, setShowPrescreen] = useState(false);

  const financeOptions = generateFinanceOptions(
    repairCost,
    customerPrescreen || undefined
  );
  const repairAnalysis = analyzeRepairDecision(repairCost, vehicleData);

  return (
    <div className="space-y-6">
      <RepairVsReplaceAnalysis
        repairCost={repairCost}
        vehicleData={vehicleData}
        analysis={repairAnalysis}
      />

      {repairAnalysis.recommendation !== "replace" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold">
                Financing Options
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to pay for this $
                {repairCost.toLocaleString()} repair
              </p>
            </div>
            {!customerPrescreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrescreen(!showPrescreen)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Better Rates
              </Button>
            )}
          </div>

          {showPrescreen && !customerPrescreen && (
            <div className="mb-6">
              <PrescreenForm
                onComplete={(data) => {
                  setCustomerPrescreen(data);
                  setShowPrescreen(false);
                }}
              />
            </div>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Options</TabsTrigger>
              <TabsTrigger value="bnpl">Pay Later</TabsTrigger>
              <TabsTrigger value="traditional">Banks</TabsTrigger>
              <TabsTrigger value="credit_union">Credit Unions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {financeOptions.map((option) => (
                  <FinanceOptionCard
                    key={option.id}
                    option={option}
                    selected={selectedOption === option.id}
                    onSelect={() => setSelectedOption(option.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bnpl" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {financeOptions
                  .filter((o) => o.type === "bnpl")
                  .map((option) => (
                    <FinanceOptionCard
                      key={option.id}
                      option={option}
                      selected={selectedOption === option.id}
                      onSelect={() => setSelectedOption(option.id)}
                    />
                  ))}
              </div>
              {financeOptions.filter((o) => o.type === "bnpl").length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Buy now, pay later options are available for repairs under
                  $1,500
                </p>
              )}
            </TabsContent>

            <TabsContent value="traditional" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {financeOptions
                  .filter((o) => o.type === "traditional")
                  .map((option) => (
                    <FinanceOptionCard
                      key={option.id}
                      option={option}
                      selected={selectedOption === option.id}
                      onSelect={() => setSelectedOption(option.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="credit_union" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {financeOptions
                  .filter((o) => o.type === "credit_union")
                  .map((option) => (
                    <FinanceOptionCard
                      key={option.id}
                      option={option}
                      selected={selectedOption === option.id}
                      onSelect={() => setSelectedOption(option.id)}
                    />
                  ))}
              </div>
              {financeOptions.filter((o) => o.type === "credit_union").length ===
                0 && (
                <p className="text-center text-muted-foreground py-8">
                  Credit union options are available for repairs over $2,000
                </p>
              )}
            </TabsContent>
          </Tabs>

          {selectedOption && (
            <div className="mt-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Ready to proceed with{" "}
                    {
                      financeOptions.find((o) => o.id === selectedOption)
                        ?.provider
                    }
                    ?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to complete your application
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const option = financeOptions.find(
                      (o) => o.id === selectedOption
                    );
                    if (option) onFinanceSelected(option);
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancePrescreen;
