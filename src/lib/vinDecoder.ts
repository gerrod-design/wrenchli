export interface DecodedVehicle {
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  cylinders: string;
  transmission: string;
  fuelType: string;
  driveType: string;
  bodyClass: string;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function isValidVin(vin: string): boolean {
  return VIN_REGEX.test(vin);
}

export function sanitizeVin(input: string): string {
  return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17);
}

export async function decodeVin(vin: string): Promise<DecodedVehicle> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(`${supabaseUrl}/functions/v1/decode-vin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
    },
    body: JSON.stringify({ vin }),
  });
  if (!resp.ok) throw new Error("Failed to reach VIN decode service");

  const data = await resp.json();
  const result = data.Results?.[0];
  if (!result) throw new Error("No results returned");

  const errorCode = result.ErrorCode || "";
  const errorCodes = errorCode.split(",").map((c: string) => c.trim());
  // ErrorCode "0" means success; if none of the codes is "0" and no Make, it's a bad VIN
  if (!errorCodes.includes("0") && !result.Make) {
    throw new Error("Invalid VIN — could not decode");
  }

  const displacement = result.DisplacementL
    ? `${parseFloat(result.DisplacementL).toFixed(1)}L`
    : "";
  const cylinders = result.EngineCylinders || "";
  const engineStr = [displacement, cylinders ? `${cylinders}-Cyl` : ""]
    .filter(Boolean)
    .join(" ");

  return {
    year: result.ModelYear || "",
    make: result.Make || "",
    model: result.Model || "",
    trim: result.Trim || "",
    engine: engineStr,
    cylinders,
    transmission: result.TransmissionStyle || "",
    fuelType: result.FuelTypePrimary || "",
    driveType: result.DriveType || "",
    bodyClass: result.BodyClass || "",
  };
}

export function vehicleDisplayName(v: DecodedVehicle): string {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}

export function vehicleDetailsLine(v: DecodedVehicle): string {
  return [v.engine, v.transmission, v.driveType, v.fuelType]
    .filter(Boolean)
    .join(" • ");
}
