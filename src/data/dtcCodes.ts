export type DtcUrgency = "low" | "medium" | "high";
export type DtcDiyFeasibility = "easy" | "moderate" | "advanced";
export type DtcCategory = "emissions" | "fuel" | "ignition" | "engine" | "cooling" | "electrical" | "transmission" | "evap" | "safety" | "abs" | "network" | "body" | "chassis" | "sensor";

export interface DtcEntry {
  code: string;
  name: string;
  description: string;
  commonCauses: string[];
  urgency: DtcUrgency;
  diyFeasibility: DtcDiyFeasibility;
  costRange: {
    diy: string;
    professional: string;
  };
  category: DtcCategory;
}

export const dtcDatabase: DtcEntry[] = [
  // ── Powertrain (P) ──
  {
    code: "P0128",
    name: "Coolant Thermostat Below Thermostat Regulating Temperature",
    description: "Your engine isn't warming up to its ideal operating temperature quickly enough. This usually means the thermostat is stuck open, letting coolant flow continuously and preventing the engine from reaching proper temperature.",
    commonCauses: [
      "Stuck-open thermostat",
      "Faulty engine coolant temperature sensor",
      "Low coolant level",
      "Thermostat housing leak"
    ],
    urgency: "low",
    diyFeasibility: "moderate",
    costRange: { diy: "$15–$50", professional: "$150–$300" },
    category: "cooling"
  },
  {
    code: "P0131",
    name: "O2 Sensor Circuit Low Voltage (Bank 1, Sensor 1)",
    description: "The upstream oxygen sensor on bank 1 is reporting a consistently low voltage, indicating the engine may be running lean or the sensor itself has failed. This can affect fuel economy and emissions.",
    commonCauses: [
      "Failed oxygen sensor",
      "Vacuum leak causing lean condition",
      "Exhaust leak before the sensor",
      "Wiring or connector damage"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$80", professional: "$150–$300" },
    category: "sensor"
  },
  {
    code: "P0136",
    name: "O2 Sensor Circuit Malfunction (Bank 1, Sensor 2)",
    description: "The downstream oxygen sensor on bank 1 is not functioning properly. This sensor monitors catalytic converter efficiency, so a malfunction may cause increased emissions and reduced fuel economy.",
    commonCauses: [
      "Failed downstream oxygen sensor",
      "Wiring or connector corrosion",
      "Exhaust leak near the sensor",
      "ECM/PCM issue (rare)"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$80", professional: "$150–$300" },
    category: "sensor"
  },
  {
    code: "P0171",
    name: "System Too Lean (Bank 1)",
    description: "Your engine is getting too much air or not enough fuel on bank 1. This can cause rough running, hesitation, or stalling. It's often caused by a vacuum leak, a dirty sensor, or a weak fuel pump.",
    commonCauses: [
      "Vacuum leak (intake manifold gasket, hoses)",
      "Dirty or faulty mass airflow (MAF) sensor",
      "Weak fuel pump or clogged fuel filter",
      "Faulty oxygen sensor readings"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$10–$50 (MAF cleaner/vacuum hose)", professional: "$150–$500" },
    category: "fuel"
  },
  {
    code: "P0174",
    name: "System Too Lean (Bank 2)",
    description: "Similar to P0171 but on bank 2 of the engine. The air-fuel mixture is too lean, which can lead to misfires, poor performance, and potential engine damage if left unaddressed.",
    commonCauses: [
      "Vacuum leak on bank 2 side",
      "Dirty or faulty mass airflow sensor",
      "Fuel delivery issue (pump, filter, injector)",
      "Intake manifold gasket leak"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$10–$50", professional: "$150–$500" },
    category: "fuel"
  },
  {
    code: "P0217",
    name: "Engine Overtemperature Condition",
    description: "Your engine has exceeded its safe operating temperature. This is serious — continuing to drive can cause severe engine damage including warped heads or a blown head gasket. Pull over safely if this occurs.",
    commonCauses: [
      "Low coolant level or coolant leak",
      "Failed water pump",
      "Stuck-closed thermostat",
      "Radiator fan failure or clogged radiator"
    ],
    urgency: "high",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$100 (thermostat/coolant)", professional: "$200–$1,000" },
    category: "cooling"
  },
  {
    code: "P0230",
    name: "Fuel Pump Primary Circuit Malfunction",
    description: "There's an electrical problem with the fuel pump circuit. This can cause the engine to stall, not start, or run poorly due to inconsistent fuel delivery.",
    commonCauses: [
      "Failed fuel pump relay",
      "Blown fuel pump fuse",
      "Wiring damage to fuel pump",
      "Failing fuel pump motor"
    ],
    urgency: "high",
    diyFeasibility: "moderate",
    costRange: { diy: "$5–$30 (relay/fuse)", professional: "$300–$800" },
    category: "fuel"
  },
  {
    code: "P0300",
    name: "Random/Multiple Cylinder Misfire Detected",
    description: "Your engine is misfiring across multiple cylinders, which means fuel isn't burning properly. You may notice rough idling, loss of power, or the engine shaking. This needs attention to prevent catalytic converter damage.",
    commonCauses: [
      "Worn or fouled spark plugs",
      "Failing ignition coils",
      "Vacuum leak",
      "Low fuel pressure or clogged fuel injectors"
    ],
    urgency: "high",
    diyFeasibility: "moderate",
    costRange: { diy: "$30–$100 (spark plugs)", professional: "$200–$600" },
    category: "ignition"
  },
  {
    code: "P0301",
    name: "Cylinder 1 Misfire Detected",
    description: "Cylinder 1 in your engine is not firing properly. This causes rough running, vibration, and can damage your catalytic converter over time. The fix is often as simple as replacing a spark plug or ignition coil.",
    commonCauses: [
      "Worn spark plug in cylinder 1",
      "Faulty ignition coil for cylinder 1",
      "Clogged fuel injector",
      "Low compression in cylinder 1"
    ],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$10–$40 (spark plug)", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0302",
    name: "Cylinder 2 Misfire Detected",
    description: "Cylinder 2 is misfiring, meaning the fuel-air mixture isn't igniting correctly. You'll likely feel the engine running rough, especially at idle.",
    commonCauses: ["Worn spark plug", "Faulty ignition coil", "Clogged fuel injector", "Low compression"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$10–$40", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0303",
    name: "Cylinder 3 Misfire Detected",
    description: "Cylinder 3 is not firing correctly. This causes rough idle, reduced power, and increased emissions. Similar to other single-cylinder misfires, it's often an ignition component issue.",
    commonCauses: ["Worn spark plug", "Faulty ignition coil", "Clogged fuel injector", "Low compression"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$10–$40", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0304",
    name: "Cylinder 4 Misfire Detected",
    description: "Cylinder 4 is misfiring. The engine may run rough, shake at idle, or lose power during acceleration. It's commonly caused by wear on ignition components.",
    commonCauses: ["Worn spark plug", "Faulty ignition coil", "Clogged fuel injector", "Low compression"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$10–$40", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0305",
    name: "Cylinder 5 Misfire Detected",
    description: "Cylinder 5 is not firing properly. On V6 and V8 engines, this cylinder can be harder to access, which may affect DIY feasibility depending on your vehicle.",
    commonCauses: ["Worn spark plug", "Faulty ignition coil", "Clogged fuel injector", "Low compression"],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$10–$40", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0306",
    name: "Cylinder 6 Misfire Detected",
    description: "Cylinder 6 is misfiring. On many engine configurations, cylinder 6 can be in a harder-to-reach location, potentially making the repair more involved.",
    commonCauses: ["Worn spark plug", "Faulty ignition coil", "Clogged fuel injector", "Low compression"],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$10–$40", professional: "$100–$400" },
    category: "ignition"
  },
  {
    code: "P0325",
    name: "Knock Sensor 1 Circuit Malfunction",
    description: "The knock sensor detects engine detonation (knocking) and adjusts timing to prevent damage. A faulty sensor means the engine can't protect itself from harmful pre-ignition.",
    commonCauses: [
      "Failed knock sensor",
      "Wiring or connector damage",
      "Corroded sensor connector",
      "ECM issue (rare)"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$60", professional: "$150–$400" },
    category: "sensor"
  },
  {
    code: "P0340",
    name: "Camshaft Position Sensor Circuit Malfunction",
    description: "The camshaft position sensor helps the engine computer control fuel injection and ignition timing. A failure can cause the engine to run poorly, stall, or not start at all.",
    commonCauses: [
      "Failed camshaft position sensor",
      "Damaged wiring or connector",
      "Timing chain/belt issue affecting cam position",
      "ECM malfunction (rare)"
    ],
    urgency: "high",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$60", professional: "$150–$350" },
    category: "sensor"
  },
  {
    code: "P0401",
    name: "EGR Flow Insufficient Detected",
    description: "The Exhaust Gas Recirculation system isn't flowing enough exhaust gas back into the engine. This system reduces emissions and engine temperatures. Reduced flow often means a clogged passage or stuck valve.",
    commonCauses: [
      "Carbon buildup in EGR passages",
      "Stuck or clogged EGR valve",
      "Faulty EGR vacuum solenoid",
      "Clogged EGR tube or intake ports"
    ],
    urgency: "low",
    diyFeasibility: "moderate",
    costRange: { diy: "$10–$50 (cleaning supplies)", professional: "$200–$500" },
    category: "emissions"
  },
  {
    code: "P0411",
    name: "Secondary Air Injection System Incorrect Flow Detected",
    description: "The secondary air injection system pumps fresh air into the exhaust to help the catalytic converter warm up faster. Incorrect flow means this system isn't working properly, increasing cold-start emissions.",
    commonCauses: [
      "Failed secondary air pump",
      "Stuck or leaking check valve",
      "Clogged air injection passages",
      "Faulty air pump relay"
    ],
    urgency: "low",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$80", professional: "$200–$600" },
    category: "emissions"
  },
  {
    code: "P0420",
    name: "Catalyst System Efficiency Below Threshold (Bank 1)",
    description: "Your vehicle's catalytic converter isn't cleaning exhaust gases as effectively as it should. This could mean the catalytic converter is worn out, or it could be caused by an upstream issue like a failing oxygen sensor.",
    commonCauses: [
      "Worn or failing catalytic converter",
      "Faulty oxygen sensor (upstream or downstream)",
      "Exhaust leak before the catalytic converter",
      "Engine misfire causing unburned fuel to damage the converter"
    ],
    urgency: "medium",
    diyFeasibility: "advanced",
    costRange: { diy: "$50–$200 (if oxygen sensor)", professional: "$300–$2,500 (depending on cause)" },
    category: "emissions"
  },
  {
    code: "P0440",
    name: "Evaporative Emission Control System Malfunction",
    description: "The EVAP system captures fuel vapors from the gas tank and routes them to the engine to be burned. A malfunction means vapors may be escaping, which is an emissions concern but usually not a drivability issue.",
    commonCauses: [
      "Loose or damaged gas cap",
      "Faulty EVAP purge valve or vent valve",
      "Cracked or disconnected EVAP hoses",
      "Leaking charcoal canister"
    ],
    urgency: "low",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$30 (gas cap)", professional: "$100–$400" },
    category: "evap"
  },
  {
    code: "P0442",
    name: "Evaporative Emission Control System Leak Detected (Small Leak)",
    description: "A small leak has been detected in your vehicle's EVAP system, which controls fuel vapors. This is often something as simple as a loose gas cap, but can also indicate a cracked hose or faulty valve.",
    commonCauses: [
      "Loose, cracked, or missing gas cap",
      "Small crack in EVAP hose",
      "Faulty purge or vent solenoid",
      "Charcoal canister crack"
    ],
    urgency: "low",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$30 (gas cap)", professional: "$100–$350" },
    category: "evap"
  },
  {
    code: "P0446",
    name: "Evaporative Emission Control System Vent Control Circuit Malfunction",
    description: "The vent control valve in the EVAP system isn't working correctly. This valve controls airflow through the charcoal canister and is essential for the system to function properly.",
    commonCauses: [
      "Failed EVAP vent solenoid",
      "Wiring issue to vent valve",
      "Blocked vent filter or line",
      "ECM control circuit issue"
    ],
    urgency: "low",
    diyFeasibility: "moderate",
    costRange: { diy: "$20–$60", professional: "$150–$350" },
    category: "evap"
  },
  {
    code: "P0455",
    name: "Evaporative Emission Control System Leak Detected (Large Leak)",
    description: "A significant leak has been detected in the EVAP system. While large leaks sound worse, they're often easier to find — the most common cause is simply a missing or very loose gas cap.",
    commonCauses: [
      "Missing or severely damaged gas cap",
      "Disconnected EVAP hose",
      "Cracked charcoal canister",
      "Large crack in filler neck"
    ],
    urgency: "low",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$30 (gas cap)", professional: "$100–$400" },
    category: "evap"
  },
  {
    code: "P0500",
    name: "Vehicle Speed Sensor Malfunction",
    description: "The vehicle speed sensor tells the computer how fast you're going. A malfunction can cause erratic speedometer readings, transmission shifting problems, and issues with cruise control.",
    commonCauses: [
      "Failed vehicle speed sensor",
      "Damaged wiring or connector",
      "Faulty speedometer gear",
      "Transmission output shaft issue"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$15–$50", professional: "$150–$350" },
    category: "sensor"
  },
  {
    code: "P0505",
    name: "Idle Control System Malfunction",
    description: "The idle air control system isn't regulating engine idle speed properly. This can cause stalling at stops, high idle, or fluctuating RPMs when the engine should be idling smoothly.",
    commonCauses: [
      "Dirty or stuck idle air control (IAC) valve",
      "Vacuum leak",
      "Carbon buildup in throttle body",
      "Faulty IAC valve"
    ],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$15 (throttle body cleaner)", professional: "$100–$300" },
    category: "engine"
  },
  {
    code: "P0507",
    name: "Idle Air Control System RPM Higher Than Expected",
    description: "Your engine is idling faster than it should. This usually indicates a vacuum leak or a problem with the idle control system. While not immediately dangerous, it can indicate underlying issues.",
    commonCauses: [
      "Vacuum leak (hose, gasket, or intake)",
      "Dirty throttle body",
      "Faulty idle air control valve",
      "Air leak after the MAF sensor"
    ],
    urgency: "low",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$15 (cleaning)", professional: "$100–$300" },
    category: "engine"
  },
  {
    code: "P0562",
    name: "System Voltage Low",
    description: "The vehicle's electrical system voltage is lower than expected. This can cause dim lights, slow cranking, and various electrical malfunctions. It usually points to a charging system problem.",
    commonCauses: [
      "Failing alternator",
      "Worn or loose serpentine belt",
      "Corroded or loose battery terminals",
      "Aging battery unable to hold charge"
    ],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$5–$30 (terminal cleaning/belt)", professional: "$200–$500 (alternator)" },
    category: "electrical"
  },
  {
    code: "P0600",
    name: "Serial Communication Link Malfunction",
    description: "There's a communication problem within the engine control module's internal circuits. This is a relatively rare code that usually indicates an ECM hardware issue rather than a simple sensor problem.",
    commonCauses: [
      "Faulty ECM/PCM",
      "Wiring issue in ECM harness",
      "Poor ground connection",
      "Water intrusion into ECM"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$10–$30 (connector repair)", professional: "$500–$1,500 (ECM replacement)" },
    category: "electrical"
  },
  {
    code: "P0700",
    name: "Transmission Control System Malfunction",
    description: "The transmission control module has detected a problem and set a code. P0700 is a general alert — there's usually a more specific transmission code stored alongside it that pinpoints the exact issue.",
    commonCauses: [
      "Transmission solenoid failure",
      "Low or contaminated transmission fluid",
      "Wiring issue in transmission harness",
      "Faulty transmission control module"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$10–$30 (fluid check)", professional: "$200–$2,000+" },
    category: "transmission"
  },
  {
    code: "P0715",
    name: "Input/Turbine Speed Sensor Circuit Malfunction",
    description: "The input speed sensor measures how fast the transmission input shaft is spinning. A failure can cause erratic shifting, transmission slipping, or the vehicle going into limp mode.",
    commonCauses: [
      "Failed input speed sensor",
      "Damaged wiring or connector",
      "Contaminated transmission fluid",
      "Internal transmission damage"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$20–$60", professional: "$200–$600" },
    category: "transmission"
  },
  {
    code: "P0720",
    name: "Output Speed Sensor Circuit Malfunction",
    description: "The output speed sensor monitors transmission output shaft speed. A malfunction can cause harsh or erratic shifting, speedometer issues, and may trigger limp mode to protect the transmission.",
    commonCauses: [
      "Failed output speed sensor",
      "Wiring or connector damage",
      "Contaminated or low transmission fluid",
      "Sensor mounting issue"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$20–$60", professional: "$200–$600" },
    category: "transmission"
  },

  // ── Body (B) ──
  {
    code: "B0001",
    name: "Driver Frontal Stage 1 Deployment Control",
    description: "There's a problem with the driver's front airbag deployment circuit. This is a safety-critical issue — the airbag may not deploy properly in a collision. Have this inspected immediately.",
    commonCauses: [
      "Faulty clock spring in steering column",
      "Airbag module wiring issue",
      "Defective airbag control module",
      "Corroded connector"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "Not recommended (safety risk)", professional: "$200–$800" },
    category: "safety"
  },
  {
    code: "B0100",
    name: "Short to Battery or Open in Electronic Frontal Sensor",
    description: "The electronic crash sensor at the front of the vehicle has a wiring problem. This sensor is part of the airbag system and detects frontal collisions. A malfunction could prevent airbag deployment.",
    commonCauses: [
      "Damaged frontal crash sensor",
      "Wiring short or open circuit",
      "Corroded sensor connector",
      "Previous collision damage"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "Not recommended (safety risk)", professional: "$150–$500" },
    category: "safety"
  },

  // ── Chassis (C) ──
  {
    code: "C0035",
    name: "Left Front Wheel Speed Sensor Circuit",
    description: "The ABS system can't read the speed of your left front wheel. This means ABS and traction control may not work properly, which could affect braking in slippery conditions.",
    commonCauses: [
      "Failed wheel speed sensor",
      "Damaged sensor wiring (road debris, corrosion)",
      "Sensor air gap too large",
      "Damaged reluctor ring on wheel hub"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$15–$50", professional: "$150–$350" },
    category: "abs"
  },
  {
    code: "C0300",
    name: "Rear Speed Sensor Malfunction",
    description: "The rear wheel speed sensor is not functioning correctly. This affects ABS, traction control, and stability control systems. Your vehicle will still brake normally, but without ABS assistance.",
    commonCauses: [
      "Failed rear speed sensor",
      "Wiring damage from road debris or corrosion",
      "Contaminated sensor tip",
      "Damaged reluctor ring"
    ],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$15–$50", professional: "$150–$350" },
    category: "abs"
  },

  // ── Network (U) ──
  {
    code: "U0100",
    name: "Lost Communication With ECM/PCM",
    description: "Other vehicle modules can't communicate with the engine control module. This can cause multiple warning lights, poor engine performance, or a no-start condition. It's a serious communication failure.",
    commonCauses: [
      "CAN bus wiring issue (open or short)",
      "Failed ECM/PCM",
      "Blown ECM fuse",
      "Corroded ground connection"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$5–$20 (fuse check)", professional: "$200–$1,500" },
    category: "network"
  },
  {
    code: "U0101",
    name: "Lost Communication With TCM",
    description: "The transmission control module has lost communication with the rest of the vehicle's network. This can cause the transmission to go into limp mode, get stuck in one gear, or shift erratically.",
    commonCauses: [
      "CAN bus wiring fault",
      "Failed transmission control module",
      "Blown TCM fuse",
      "Corroded connectors"
    ],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$5–$20 (fuse check)", professional: "$200–$1,200" },
    category: "network"
  },
];

// Index for fast lookups
const dtcIndex = new Map<string, DtcEntry>();
dtcDatabase.forEach((entry) => dtcIndex.set(entry.code, entry));

const DTC_PATTERN = /^[PBCUpbcu][0-9]{4}$/;

export function parseDtcCodes(input: string): string[] {
  const tokens = input
    .split(/[\s,;]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => DTC_PATTERN.test(t));
  return [...new Set(tokens)];
}

/** Returns the full DTC entry if found, null otherwise */
export function getDtcEntry(code: string): DtcEntry | null {
  return dtcIndex.get(code.toUpperCase()) ?? null;
}

/** Simple description getter for backward compatibility */
export function getDtcDescription(code: string): string | null {
  return dtcIndex.get(code.toUpperCase())?.name ?? null;
}

/** Check if a string looks like a valid OBD2 code pattern */
export function isValidDtcPattern(code: string): boolean {
  return DTC_PATTERN.test(code.toUpperCase());
}
