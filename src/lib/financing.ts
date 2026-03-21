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
