// Check if ZIP is in Michigan
export function isMichiganZip(zip: string): boolean {
  if (!zip) return false;
  const zipNum = parseInt(zip.replace(/\D/g, ""), 10);
  return zipNum >= 48000 && zipNum <= 49999;
}

// Calculate monthly payment (amortized)
export function calculateMonthlyPayment(
  principal: number,
  apr: number,
  months: number
): number {
  const monthlyRate = apr / 12 / 100;
  if (monthlyRate === 0) return Math.round((principal / months) * 100) / 100;
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// MI Affordable Loan constants
export const MI_LOAN = {
  maxAmount: 1200,
  termMonths: 12,
  maxApr: 36,
  supportPhone: "(800) 242-9790",
} as const;

// Detect user's state via IP geolocation
export async function detectUserState(): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.region_code || null;
  } catch {
    return null;
  }
}

// Calculate financing scenario (full vs partial)
export function calculateFinancingScenario(repairCost: number, maxLoan: number = MI_LOAN.maxAmount) {
  const isFullFinancing = repairCost <= maxLoan;
  const loanAmount = isFullFinancing ? repairCost : maxLoan;
  const outOfPocket = isFullFinancing ? 0 : repairCost - maxLoan;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, MI_LOAN.maxApr, MI_LOAN.termMonths);
  const totalLoanCost = Math.round(monthlyPayment * MI_LOAN.termMonths * 100) / 100;
  const isPartial = !isFullFinancing && repairCost <= 5000;
  const isTooHigh = repairCost > 5000;

  return {
    isFullFinancing,
    isPartial,
    isTooHigh,
    loanAmount,
    outOfPocket,
    monthlyPayment,
    totalLoanCost,
    repairCost,
  };
}
