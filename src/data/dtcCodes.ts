/** Common OBD2 Diagnostic Trouble Codes */
export const dtcDatabase: Record<string, string> = {
  // Powertrain (P) codes
  P0100: "Mass or Volume Air Flow Circuit Malfunction",
  P0101: "Mass or Volume Air Flow Circuit Range/Performance",
  P0102: "Mass or Volume Air Flow Circuit Low Input",
  P0103: "Mass or Volume Air Flow Circuit High Input",
  P0110: "Intake Air Temperature Circuit Malfunction",
  P0120: "Throttle Position Sensor/Switch A Circuit Malfunction",
  P0121: "Throttle Position Sensor/Switch A Circuit Range/Performance",
  P0125: "Insufficient Coolant Temperature for Closed Loop Fuel Control",
  P0128: "Coolant Thermostat Below Thermostat Regulating Temperature",
  P0130: "O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)",
  P0131: "O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)",
  P0133: "O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)",
  P0135: "O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)",
  P0141: "O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 2)",
  P0171: "System Too Lean (Bank 1)",
  P0172: "System Too Rich (Bank 1)",
  P0174: "System Too Lean (Bank 2)",
  P0175: "System Too Rich (Bank 2)",
  P0200: "Injector Circuit Malfunction",
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0301: "Cylinder 1 Misfire Detected",
  P0302: "Cylinder 2 Misfire Detected",
  P0303: "Cylinder 3 Misfire Detected",
  P0304: "Cylinder 4 Misfire Detected",
  P0305: "Cylinder 5 Misfire Detected",
  P0306: "Cylinder 6 Misfire Detected",
  P0325: "Knock Sensor 1 Circuit Malfunction (Bank 1)",
  P0340: "Camshaft Position Sensor Circuit Malfunction",
  P0341: "Camshaft Position Sensor Circuit Range/Performance",
  P0400: "Exhaust Gas Recirculation Flow Malfunction",
  P0401: "Exhaust Gas Recirculation Flow Insufficient Detected",
  P0402: "Exhaust Gas Recirculation Flow Excessive Detected",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0430: "Catalyst System Efficiency Below Threshold (Bank 2)",
  P0440: "Evaporative Emission Control System Malfunction",
  P0441: "Evaporative Emission Control System Incorrect Purge Flow",
  P0442: "Evaporative Emission Control System Leak Detected (Small Leak)",
  P0443: "Evaporative Emission Control System Purge Control Valve Circuit",
  P0446: "Evaporative Emission Control System Vent Control Circuit",
  P0449: "Evaporative Emission Control System Vent Valve/Solenoid Circuit",
  P0455: "Evaporative Emission Control System Leak Detected (Gross Leak)",
  P0456: "Evaporative Emission Control System Leak Detected (Very Small Leak)",
  P0500: "Vehicle Speed Sensor Malfunction",
  P0505: "Idle Control System Malfunction",
  P0507: "Idle Control System RPM Higher Than Expected",
  P0520: "Engine Oil Pressure Sensor/Switch Circuit",
  P0562: "System Voltage Low",
  P0600: "Serial Communication Link Malfunction",
  P0700: "Transmission Control System Malfunction",
  P0705: "Transmission Range Sensor Circuit Malfunction",
  P0715: "Input/Turbine Speed Sensor Circuit Malfunction",
  P0720: "Output Speed Sensor Circuit Malfunction",
  P0730: "Incorrect Gear Ratio",
  P0740: "Torque Converter Clutch Circuit Malfunction",
  P0741: "Torque Converter Clutch Circuit Performance or Stuck Off",
  P0750: "Shift Solenoid A Malfunction",
  P0755: "Shift Solenoid B Malfunction",

  // Body (B) codes
  B0001: "Driver Frontal Stage 1 Deployment Control",
  B0002: "Driver Frontal Stage 2 Deployment Control",
  B0010: "Passenger Frontal Stage 1 Deployment Control",
  B0050: "Driver Side/Curtain Deployment Control",
  B0100: "Electronic Frontal Sensor 1",
  B1000: "ECU Malfunction — Internal",
  B1200: "Climate Control Push Button Circuit",
  B1300: "HV Battery Malfunction",
  B1380: "Ignition Run/Accessory Circuit",
  B1600: "PATS Received Incorrect Key-Code",

  // Chassis (C) codes
  C0035: "Left Front Wheel Speed Circuit Malfunction",
  C0040: "Right Front Wheel Speed Circuit Malfunction",
  C0045: "Left Rear Wheel Speed Circuit Malfunction",
  C0050: "Right Rear Wheel Speed Circuit Malfunction",
  C0060: "Left Front ABS Solenoid #1 Circuit Malfunction",
  C0110: "Pump Motor Circuit Malfunction",
  C0200: "ABS/TCS Hydraulic Valve Circuit",
  C0300: "Rear Speed Sensor Malfunction",
  C1095: "ABS Hydraulic Pump Motor Circuit",
  C1200: "ABS Warning Lamp Circuit Short to Battery",

  // Network (U) codes
  U0100: "Lost Communication With ECM/PCM A",
  U0101: "Lost Communication With TCM",
  U0121: "Lost Communication With Anti-Lock Brake System",
  U0140: "Lost Communication With Body Control Module",
  U0155: "Lost Communication With Instrument Panel Cluster",
  U0164: "Lost Communication With HVAC Control Module",
  U0300: "Internal Control Module Software Incompatibility",
  U0401: "Invalid Data Received From ECM/PCM",
  U1000: "CAN Communication Bus — No Communication",
};

const DTC_PATTERN = /^[PBCUpbcu][0-9]{4}$/;

export function parseDtcCodes(input: string): string[] {
  const tokens = input
    .split(/[\s,;]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => DTC_PATTERN.test(t));
  return [...new Set(tokens)];
}

export function getDtcDescription(code: string): string | null {
  return dtcDatabase[code.toUpperCase()] ?? null;
}
