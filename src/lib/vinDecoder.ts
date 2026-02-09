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
  const resp = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
  );
  if (!resp.ok) throw new Error("Failed to reach NHTSA API");

  const data = await resp.json();
  const result = data.Results?.[0];
  if (!result) throw new Error("No results returned");

  const errorCode = result.ErrorCode;
  // ErrorCode "0" means success; anything else with no Make means a bad VIN
  if (errorCode !== "0" && !result.Make) {
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
