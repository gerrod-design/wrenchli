// Comprehensive make-specific known issues database with mileage ranges
// Used to inject vehicle-specific context into the chat system prompt

export interface KnownIssue {
  issue: string;
  minMiles: number;
  maxMiles: number;
  preventiveCost: string;
  repairCost: string;
  severity: "low" | "medium" | "high";
  systems: string; // e.g. "engine", "transmission", "electrical"
}

export const VEHICLE_KNOWN_ISSUES: Record<string, KnownIssue[]> = {
  Acura: [
    { issue: "Power steering pump whine/leak", minMiles: 80000, maxMiles: 130000, preventiveCost: "$50–100 (fluid flush)", repairCost: "$400–800", severity: "medium", systems: "steering" },
    { issue: "Starter motor failure", minMiles: 100000, maxMiles: 150000, preventiveCost: "N/A", repairCost: "$350–600", severity: "medium", systems: "electrical" },
  ],
  Audi: [
    { issue: "Oil consumption (2.0T engines)", minMiles: 40000, maxMiles: 100000, preventiveCost: "$100–200 (frequent checks)", repairCost: "$2,000–5,000 (piston rings)", severity: "high", systems: "engine" },
    { issue: "Timing chain tensioner failure", minMiles: 60000, maxMiles: 120000, preventiveCost: "$200–400 (inspection)", repairCost: "$2,500–5,000", severity: "high", systems: "engine" },
    { issue: "Mechatronic unit failure (DSG)", minMiles: 70000, maxMiles: 120000, preventiveCost: "$200–400 (fluid service)", repairCost: "$2,000–4,000", severity: "high", systems: "transmission" },
    { issue: "Water pump/thermostat failure", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$800–1,500", severity: "medium", systems: "cooling" },
  ],
  BMW: [
    { issue: "Cooling system failure (water pump, thermostat, expansion tank)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$300–500", repairCost: "$1,500–3,000", severity: "high", systems: "cooling" },
    { issue: "Oil leak (valve cover gasket)", minMiles: 80000, maxMiles: 120000, preventiveCost: "$200–400", repairCost: "$800–1,500", severity: "medium", systems: "engine" },
    { issue: "VANOS solenoid failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "$50–100 (oil changes)", repairCost: "$500–1,200", severity: "medium", systems: "engine" },
    { issue: "Electric window regulator failure", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$300–600", severity: "low", systems: "electrical" },
    { issue: "Oil filter housing gasket leak", minMiles: 50000, maxMiles: 90000, preventiveCost: "$100–200", repairCost: "$400–800", severity: "medium", systems: "engine" },
  ],
  Buick: [
    { issue: "Intake manifold gasket leak", minMiles: 70000, maxMiles: 120000, preventiveCost: "$100–200 (coolant flush)", repairCost: "$500–1,000", severity: "medium", systems: "engine" },
    { issue: "Power steering rack leak", minMiles: 80000, maxMiles: 130000, preventiveCost: "$50–100", repairCost: "$600–1,200", severity: "medium", systems: "steering" },
  ],
  Cadillac: [
    { issue: "CUE infotainment screen delamination", minMiles: 30000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$500–1,200", severity: "low", systems: "electrical" },
    { issue: "Northstar engine head gasket failure (older models)", minMiles: 80000, maxMiles: 150000, preventiveCost: "$200–400", repairCost: "$3,000–5,000", severity: "high", systems: "engine" },
  ],
  Chevrolet: [
    { issue: "AFM/DOD lifter failure (V8 engines)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$300–500 (AFM disable)", repairCost: "$3,000–6,000", severity: "high", systems: "engine" },
    { issue: "Transmission shudder (8-speed, 10-speed)", minMiles: 30000, maxMiles: 80000, preventiveCost: "$200–400 (fluid flush)", repairCost: "$1,500–4,000", severity: "high", systems: "transmission" },
    { issue: "Intake manifold gasket leak (3.1L, 3.4L V6)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$500–1,000", severity: "medium", systems: "engine" },
    { issue: "Power window switch failure", minMiles: 50000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$100–250", severity: "low", systems: "electrical" },
  ],
  Chrysler: [
    { issue: "Transmission failure (62TE, 9-speed)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–5,500", severity: "high", systems: "transmission" },
    { issue: "TIPM (Totally Integrated Power Module) failure", minMiles: 60000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$800–1,500", severity: "high", systems: "electrical" },
  ],
  Dodge: [
    { issue: "TIPM electrical issues (fuel pump relay)", minMiles: 50000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$800–1,500", severity: "high", systems: "electrical" },
    { issue: "Ball joint wear (Ram trucks)", minMiles: 50000, maxMiles: 80000, preventiveCost: "$100–200 (inspection)", repairCost: "$400–800 per side", severity: "high", systems: "suspension" },
    { issue: "Exhaust manifold bolt breakage (Hemi)", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$500–1,200", severity: "medium", systems: "exhaust" },
  ],
  Ford: [
    { issue: "Spark plug ejection (5.4L V8 Triton)", minMiles: 80000, maxMiles: 120000, preventiveCost: "$150–300", repairCost: "$500–1,200", severity: "high", systems: "engine" },
    { issue: "Cam phaser rattle (5.0L Coyote, 3.5L EcoBoost)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$100–200 (oil changes)", repairCost: "$2,000–4,000", severity: "high", systems: "engine" },
    { issue: "Transmission shudder (10R80 10-speed)", minMiles: 20000, maxMiles: 70000, preventiveCost: "$200–400 (fluid flush)", repairCost: "$2,000–4,500", severity: "high", systems: "transmission" },
    { issue: "Door latch failure (multiple models)", minMiles: 40000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$200–400", severity: "medium", systems: "body" },
    { issue: "Water pump failure (EcoBoost engines)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$600–1,200", severity: "medium", systems: "cooling" },
  ],
  GMC: [
    { issue: "AFM/DOD lifter failure (V8 engines)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$300–500 (AFM disable)", repairCost: "$3,000–6,000", severity: "high", systems: "engine" },
    { issue: "Transmission shudder (8-speed, 10-speed)", minMiles: 30000, maxMiles: 80000, preventiveCost: "$200–400 (fluid flush)", repairCost: "$1,500–4,000", severity: "high", systems: "transmission" },
    { issue: "Fuel level sensor failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$300–600", severity: "low", systems: "fuel" },
  ],
  Honda: [
    { issue: "VTC actuator rattle on cold start (2.4L)", minMiles: 80000, maxMiles: 150000, preventiveCost: "$50–100 (oil changes)", repairCost: "$500–900", severity: "low", systems: "engine" },
    { issue: "AC compressor clutch failure", minMiles: 80000, maxMiles: 140000, preventiveCost: "N/A", repairCost: "$600–1,000", severity: "medium", systems: "HVAC" },
    { issue: "Rear differential fluid degradation (AWD models)", minMiles: 30000, maxMiles: 60000, preventiveCost: "$80–150 (fluid change)", repairCost: "$1,500–3,000", severity: "medium", systems: "drivetrain" },
    { issue: "Starter motor failure", minMiles: 100000, maxMiles: 180000, preventiveCost: "N/A", repairCost: "$350–600", severity: "medium", systems: "electrical" },
  ],
  Hyundai: [
    { issue: "Engine bearing failure / rod knock (Theta II 2.0T/2.4L)", minMiles: 50000, maxMiles: 120000, preventiveCost: "$100–200 (oil changes on schedule)", repairCost: "$4,000–8,000 (engine replacement)", severity: "high", systems: "engine" },
    { issue: "Catalytic converter failure", minMiles: 80000, maxMiles: 130000, preventiveCost: "N/A", repairCost: "$1,000–2,500", severity: "medium", systems: "exhaust" },
    { issue: "Steering coupler noise", minMiles: 40000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$200–400", severity: "low", systems: "steering" },
  ],
  Infiniti: [
    { issue: "CVT transmission issues (QX60)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–5,000", severity: "high", systems: "transmission" },
    { issue: "Catalytic converter failure", minMiles: 80000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$1,500–3,000", severity: "medium", systems: "exhaust" },
  ],
  Jeep: [
    { issue: "Death wobble (Wrangler, Gladiator — steering damper/track bar)", minMiles: 40000, maxMiles: 80000, preventiveCost: "$200–400 (damper replacement)", repairCost: "$800–2,000", severity: "high", systems: "steering" },
    { issue: "Oil cooler housing leak (3.6L Pentastar)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$500–1,000", severity: "medium", systems: "engine" },
    { issue: "TIPM electrical issues", minMiles: 50000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$800–1,500", severity: "high", systems: "electrical" },
    { issue: "Cylinder head cracking (3.6L Pentastar, pre-2013)", minMiles: 50000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$2,000–4,000", severity: "high", systems: "engine" },
  ],
  Kia: [
    { issue: "Engine bearing failure (Theta II 2.0T/2.4L)", minMiles: 50000, maxMiles: 120000, preventiveCost: "$100–200 (oil changes on schedule)", repairCost: "$4,000–8,000 (engine replacement)", severity: "high", systems: "engine" },
    { issue: "Catalytic converter failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$1,000–2,500", severity: "medium", systems: "exhaust" },
  ],
  Lexus: [
    { issue: "Dashboard cracking/melting (older models)", minMiles: 50000, maxMiles: 150000, preventiveCost: "$50–100 (dash cover)", repairCost: "$1,500–2,500", severity: "low", systems: "interior" },
    { issue: "Water pump weep (V6/V8 models)", minMiles: 80000, maxMiles: 130000, preventiveCost: "$100–200", repairCost: "$500–900", severity: "medium", systems: "cooling" },
  ],
  Mazda: [
    { issue: "Carbon buildup (SkyActiv-G direct injection)", minMiles: 50000, maxMiles: 100000, preventiveCost: "$200–400 (walnut blast cleaning)", repairCost: "$500–800", severity: "medium", systems: "engine" },
    { issue: "Infotainment/CMU screen issues", minMiles: 40000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$300–700", severity: "low", systems: "electrical" },
  ],
  "Mercedes-Benz": [
    { issue: "Transmission conductor plate failure (7G-Tronic)", minMiles: 70000, maxMiles: 110000, preventiveCost: "$150–300 (fluid service)", repairCost: "$1,500–3,500", severity: "high", systems: "transmission" },
    { issue: "Balance shaft gear wear (M272 engine)", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$3,000–6,000", severity: "high", systems: "engine" },
    { issue: "Air suspension compressor/strut failure", minMiles: 80000, maxMiles: 130000, preventiveCost: "$100–200 (inspection)", repairCost: "$1,500–3,000 per corner", severity: "high", systems: "suspension" },
    { issue: "SAM module water intrusion", minMiles: 60000, maxMiles: 120000, preventiveCost: "$50–100 (drain cleaning)", repairCost: "$800–2,000", severity: "medium", systems: "electrical" },
  ],
  Nissan: [
    { issue: "CVT transmission issues (Jatco)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–5,000", severity: "high", systems: "transmission" },
    { issue: "Catalytic converter failure", minMiles: 80000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$1,000–2,500", severity: "medium", systems: "exhaust" },
    { issue: "Timing chain stretch/rattle (QR25DE)", minMiles: 100000, maxMiles: 150000, preventiveCost: "$100–200 (oil changes)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
  ],
  Ram: [
    { issue: "Exhaust manifold bolt breakage (Hemi)", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$500–1,200", severity: "medium", systems: "exhaust" },
    { issue: "Ball joint wear", minMiles: 50000, maxMiles: 80000, preventiveCost: "$100–200 (inspection)", repairCost: "$400–800 per side", severity: "high", systems: "suspension" },
    { issue: "eTorque mild hybrid system issues", minMiles: 40000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$1,000–2,500", severity: "medium", systems: "electrical" },
  ],
  Subaru: [
    { issue: "Head gasket failure (EJ25 engine, pre-2012)", minMiles: 80000, maxMiles: 150000, preventiveCost: "$100–200 (coolant monitoring)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
    { issue: "Oil consumption (FB25 engine)", minMiles: 50000, maxMiles: 100000, preventiveCost: "$100–200 (frequent checks)", repairCost: "$2,000–4,000 (piston rings)", severity: "high", systems: "engine" },
    { issue: "CVT shudder/hesitation", minMiles: 60000, maxMiles: 100000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–6,000", severity: "high", systems: "transmission" },
  ],
  Tesla: [
    { issue: "Suspension control arm ball joint wear", minMiles: 30000, maxMiles: 60000, preventiveCost: "$100–200 (inspection)", repairCost: "$500–1,200", severity: "medium", systems: "suspension" },
    { issue: "Door handle mechanism failure (Model S/X)", minMiles: 30000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$300–700", severity: "low", systems: "body" },
    { issue: "MCU (Media Control Unit) failure (pre-2018)", minMiles: 40000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$1,500–2,500", severity: "medium", systems: "electrical" },
    { issue: "12V battery drain", minMiles: 30000, maxMiles: 70000, preventiveCost: "N/A", repairCost: "$100–250", severity: "low", systems: "electrical" },
  ],
  Toyota: [
    { issue: "Water pump failure (2.5L 4-cylinder)", minMiles: 80000, maxMiles: 130000, preventiveCost: "$100–200", repairCost: "$500–900", severity: "medium", systems: "cooling" },
    { issue: "Dashboard rattle/creak (Tacoma, Tundra)", minMiles: 20000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$100–300", severity: "low", systems: "interior" },
    { issue: "Frame rust (Tacoma, Tundra, 4Runner — pre-2016)", minMiles: 60000, maxMiles: 150000, preventiveCost: "$200–500 (undercoating)", repairCost: "$3,000–10,000+ (frame replacement)", severity: "high", systems: "body" },
    { issue: "Carbon buildup (direct injection engines)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$200–400 (walnut blast cleaning)", repairCost: "$500–800", severity: "medium", systems: "engine" },
  ],
  Volkswagen: [
    { issue: "Timing chain tensioner failure (TSI engines)", minMiles: 50000, maxMiles: 100000, preventiveCost: "$200–400 (inspection)", repairCost: "$2,000–4,000", severity: "high", systems: "engine" },
    { issue: "DSG mechatronic unit failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "$200–400 (fluid service)", repairCost: "$2,000–4,000", severity: "high", systems: "transmission" },
    { issue: "Water pump failure (2.0T EA888)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$600–1,200", severity: "medium", systems: "cooling" },
    { issue: "PCV valve failure", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$300–600", severity: "medium", systems: "engine" },
  ],
  Volvo: [
    { issue: "Oil trap/PCV system failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$300–700", severity: "medium", systems: "engine" },
    { issue: "ETM (Electronic Throttle Module) failure (older models)", minMiles: 60000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$400–900", severity: "medium", systems: "engine" },
    { issue: "Transmission solenoid issues", minMiles: 80000, maxMiles: 130000, preventiveCost: "$200–400 (fluid service)", repairCost: "$800–2,000", severity: "medium", systems: "transmission" },
  ],
  Genesis: [
    { issue: "Turbo wastegate rattle (3.3T V6)", minMiles: 40000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$800–1,500", severity: "medium", systems: "engine" },
    { issue: "Infotainment system freezing/rebooting", minMiles: 20000, maxMiles: 60000, preventiveCost: "N/A", repairCost: "$500–1,200 (module replacement)", severity: "low", systems: "electrical" },
    { issue: "Suspension bushing wear (G70, G80)", minMiles: 50000, maxMiles: 90000, preventiveCost: "$100–200 (inspection)", repairCost: "$400–800", severity: "medium", systems: "suspension" },
  ],
  "Land Rover": [
    { issue: "Air suspension compressor failure", minMiles: 50000, maxMiles: 100000, preventiveCost: "$100–200 (inspection)", repairCost: "$1,500–3,500", severity: "high", systems: "suspension" },
    { issue: "Timing chain tensioner failure (AJ-V6/V8)", minMiles: 60000, maxMiles: 110000, preventiveCost: "$200–400 (inspection)", repairCost: "$3,000–6,000", severity: "high", systems: "engine" },
    { issue: "Coolant leak (crossover pipe / thermostat housing)", minMiles: 50000, maxMiles: 90000, preventiveCost: "$100–200", repairCost: "$800–1,500", severity: "high", systems: "cooling" },
    { issue: "Terrain Response module failure", minMiles: 60000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$600–1,200", severity: "medium", systems: "electrical" },
    { issue: "Sunroof drain blockage causing water intrusion", minMiles: 40000, maxMiles: 100000, preventiveCost: "$50–100 (drain cleaning)", repairCost: "$500–2,000", severity: "medium", systems: "body" },
  ],
  Lincoln: [
    { issue: "Cam phaser rattle (shared Ford EcoBoost)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$100–200 (oil changes)", repairCost: "$2,000–4,000", severity: "high", systems: "engine" },
    { issue: "Transmission shudder (10-speed, shared Ford 10R80)", minMiles: 20000, maxMiles: 70000, preventiveCost: "$200–400 (fluid flush)", repairCost: "$2,000–4,500", severity: "high", systems: "transmission" },
    { issue: "Air suspension strut leak (Continental, Navigator)", minMiles: 60000, maxMiles: 110000, preventiveCost: "$100–200 (inspection)", repairCost: "$1,200–2,500 per corner", severity: "high", systems: "suspension" },
    { issue: "Door handle electronics failure", minMiles: 40000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$300–700", severity: "low", systems: "electrical" },
  ],
  Lucid: [
    { issue: "12V auxiliary battery drain", minMiles: 10000, maxMiles: 50000, preventiveCost: "N/A", repairCost: "$150–300", severity: "low", systems: "electrical" },
    { issue: "Door alignment / panel gap inconsistency", minMiles: 0, maxMiles: 30000, preventiveCost: "N/A", repairCost: "$200–600 (warranty adjustment)", severity: "low", systems: "body" },
    { issue: "Software-related charging interruptions", minMiles: 0, maxMiles: 50000, preventiveCost: "N/A (OTA updates)", repairCost: "$0–500 (service visit)", severity: "medium", systems: "electrical" },
    { issue: "Suspension damper calibration issues", minMiles: 15000, maxMiles: 50000, preventiveCost: "N/A", repairCost: "$800–2,000", severity: "medium", systems: "suspension" },
  ],
  Mitsubishi: [
    { issue: "CVT transmission shudder/failure (Outlander, Eclipse Cross)", minMiles: 60000, maxMiles: 110000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–5,500", severity: "high", systems: "transmission" },
    { issue: "Timing chain stretch (4B11 engine)", minMiles: 80000, maxMiles: 130000, preventiveCost: "$100–200 (oil changes)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
    { issue: "AC compressor failure", minMiles: 70000, maxMiles: 120000, preventiveCost: "N/A", repairCost: "$600–1,200", severity: "medium", systems: "HVAC" },
    { issue: "Rear differential seal leak (AWD models)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$80–150 (fluid change)", repairCost: "$400–800", severity: "medium", systems: "drivetrain" },
  ],
  Porsche: [
    { issue: "IMS bearing failure (996/997 flat-six)", minMiles: 40000, maxMiles: 100000, preventiveCost: "$2,000–3,000 (IMS retrofit)", repairCost: "$8,000–20,000 (engine rebuild)", severity: "high", systems: "engine" },
    { issue: "Coolant pipe leak (Cayenne, Panamera V8)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$1,500–3,000", severity: "high", systems: "cooling" },
    { issue: "PDK mechatronic unit issues", minMiles: 70000, maxMiles: 120000, preventiveCost: "$300–500 (fluid service)", repairCost: "$3,000–6,000", severity: "high", systems: "transmission" },
    { issue: "Air-cooled cylinder bore scoring (older 911)", minMiles: 60000, maxMiles: 120000, preventiveCost: "$200–400 (oil analysis)", repairCost: "$10,000–25,000 (engine rebuild)", severity: "high", systems: "engine" },
    { issue: "HVAC blower motor / regulator failure", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$500–1,000", severity: "low", systems: "HVAC" },
  ],
  Rivian: [
    { issue: "Drive unit noise / whine", minMiles: 10000, maxMiles: 50000, preventiveCost: "N/A", repairCost: "$2,000–5,000 (motor replacement)", severity: "medium", systems: "drivetrain" },
    { issue: "Tonneau cover motor failure (R1T)", minMiles: 5000, maxMiles: 40000, preventiveCost: "N/A", repairCost: "$500–1,500", severity: "low", systems: "body" },
    { issue: "12V battery drain / BMS issues", minMiles: 10000, maxMiles: 50000, preventiveCost: "N/A", repairCost: "$150–400", severity: "medium", systems: "electrical" },
    { issue: "Infotainment screen lag / reboot loops", minMiles: 0, maxMiles: 40000, preventiveCost: "N/A (OTA updates)", repairCost: "$0–800", severity: "low", systems: "electrical" },
  ],
  "Alfa Romeo": [
    { issue: "Engine oil leak (MultiAir actuator)", minMiles: 30000, maxMiles: 80000, preventiveCost: "$100–200 (inspection)", repairCost: "$800–1,500", severity: "high", systems: "engine" },
    { issue: "Electrical gremlins (dashboard warnings, sensor faults)", minMiles: 20000, maxMiles: 70000, preventiveCost: "N/A", repairCost: "$300–1,200", severity: "medium", systems: "electrical" },
    { issue: "Transmission shudder (ZF 8-speed in Giulia/Stelvio)", minMiles: 40000, maxMiles: 90000, preventiveCost: "$200–400 (fluid service)", repairCost: "$1,500–3,500", severity: "high", systems: "transmission" },
    { issue: "Turbo wastegate rattle (2.0T)", minMiles: 30000, maxMiles: 70000, preventiveCost: "N/A", repairCost: "$600–1,200", severity: "medium", systems: "engine" },
  ],
  Fiat: [
    { issue: "MultiAir unit failure (1.4L turbo)", minMiles: 40000, maxMiles: 90000, preventiveCost: "$100–200 (oil changes on schedule)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
    { issue: "Clutch actuator failure (500 automated manual)", minMiles: 30000, maxMiles: 70000, preventiveCost: "N/A", repairCost: "$800–1,500", severity: "high", systems: "transmission" },
    { issue: "Electrical system issues (body control module)", minMiles: 30000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$400–1,000", severity: "medium", systems: "electrical" },
    { issue: "Turbo boost leak / intercooler hose failure", minMiles: 40000, maxMiles: 80000, preventiveCost: "$50–100 (inspection)", repairCost: "$200–500", severity: "medium", systems: "engine" },
  ],
  Jaguar: [
    { issue: "Air suspension compressor / strut failure", minMiles: 50000, maxMiles: 100000, preventiveCost: "$100–200 (inspection)", repairCost: "$1,500–3,500", severity: "high", systems: "suspension" },
    { issue: "Timing chain tensioner failure (AJ-V6/V8)", minMiles: 60000, maxMiles: 110000, preventiveCost: "$200–400 (inspection)", repairCost: "$3,000–6,000", severity: "high", systems: "engine" },
    { issue: "Supercharger nose cone bearing wear (5.0 V8)", minMiles: 60000, maxMiles: 100000, preventiveCost: "$200–400 (inspection)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
    { issue: "Infotainment / touchscreen freezing", minMiles: 30000, maxMiles: 80000, preventiveCost: "N/A", repairCost: "$500–1,500", severity: "low", systems: "electrical" },
    { issue: "Coolant crossover pipe leak (V6/V8)", minMiles: 50000, maxMiles: 90000, preventiveCost: "$100–200", repairCost: "$800–1,500", severity: "medium", systems: "cooling" },
  ],
  MINI: [
    { issue: "Timing chain tensioner failure (N14/N18 turbo)", minMiles: 40000, maxMiles: 90000, preventiveCost: "$200–400 (inspection)", repairCost: "$2,000–4,000", severity: "high", systems: "engine" },
    { issue: "Thermostat / water pump failure", minMiles: 50000, maxMiles: 90000, preventiveCost: "$100–200", repairCost: "$600–1,200", severity: "medium", systems: "cooling" },
    { issue: "Oil leak (valve cover, oil filter housing)", minMiles: 50000, maxMiles: 100000, preventiveCost: "$100–200", repairCost: "$400–900", severity: "medium", systems: "engine" },
    { issue: "Clutch wear (manual transmission models)", minMiles: 50000, maxMiles: 90000, preventiveCost: "N/A", repairCost: "$1,200–2,500", severity: "medium", systems: "transmission" },
    { issue: "Electric power steering pump failure", minMiles: 60000, maxMiles: 100000, preventiveCost: "N/A", repairCost: "$500–1,000", severity: "medium", systems: "steering" },
  ],
  Maserati: [
    { issue: "F1 / Cambiocorsa hydraulic actuator failure (older models)", minMiles: 30000, maxMiles: 70000, preventiveCost: "$200–400 (fluid service)", repairCost: "$3,000–6,000", severity: "high", systems: "transmission" },
    { issue: "Variator / cam timing solenoid failure (V8)", minMiles: 50000, maxMiles: 100000, preventiveCost: "$100–200 (oil changes)", repairCost: "$1,500–3,000", severity: "high", systems: "engine" },
    { issue: "Electrical sensor failures (O2, MAF, crank position)", minMiles: 40000, maxMiles: 90000, preventiveCost: "N/A", repairCost: "$300–800", severity: "medium", systems: "electrical" },
    { issue: "Suspension bushing / control arm wear (Ghibli, Levante)", minMiles: 40000, maxMiles: 80000, preventiveCost: "$100–200 (inspection)", repairCost: "$600–1,500", severity: "medium", systems: "suspension" },
  ],
  Polestar: [
    { issue: "12V battery drain (Polestar 2)", minMiles: 5000, maxMiles: 40000, preventiveCost: "N/A", repairCost: "$150–300", severity: "low", systems: "electrical" },
    { issue: "TCAM (connectivity module) failure", minMiles: 10000, maxMiles: 50000, preventiveCost: "N/A", repairCost: "$500–1,200", severity: "medium", systems: "electrical" },
    { issue: "Heat pump / HVAC compressor issues (cold climates)", minMiles: 20000, maxMiles: 60000, preventiveCost: "N/A", repairCost: "$1,000–2,500", severity: "medium", systems: "HVAC" },
    { issue: "Infotainment Android Automotive lag / crashes", minMiles: 0, maxMiles: 40000, preventiveCost: "N/A (OTA updates)", repairCost: "$0–500", severity: "low", systems: "electrical" },
  ],
};

/**
 * Build a vehicle-specific context string to inject into the system prompt.
 * Returns empty string if no relevant data exists.
 */
export function buildVehicleContext(vehicle?: {
  year?: string;
  make?: string;
  model?: string;
  mileage?: number;
}): string {
  if (!vehicle?.make) return "";

  const make = vehicle.make;
  const issues = VEHICLE_KNOWN_ISSUES[make];
  if (!issues || issues.length === 0) {
    return `\n\n**ACTIVE VEHICLE CONTEXT:**\nThe user's vehicle is a ${[vehicle.year, make, vehicle.model].filter(Boolean).join(" ")}${vehicle.mileage ? ` with approximately ${vehicle.mileage.toLocaleString()} miles` : ""}. No specific known common issues in the database for ${make}, but use your general automotive knowledge to advise on typical maintenance needs for this vehicle.`;
  }

  const mileage = vehicle.mileage;
  const vehicleName = [vehicle.year, make, vehicle.model].filter(Boolean).join(" ");

  // Split issues into relevant (near current mileage) and upcoming
  let relevantIssues: KnownIssue[] = [];
  let upcomingIssues: KnownIssue[] = [];

  if (mileage) {
    relevantIssues = issues.filter(
      (i) => mileage >= i.minMiles - 15000 && mileage <= i.maxMiles
    );
    upcomingIssues = issues.filter(
      (i) => mileage < i.minMiles - 15000 && mileage < i.minMiles
    );
  } else {
    // No mileage — show all issues
    relevantIssues = issues;
  }

  let context = `\n\n**ACTIVE VEHICLE CONTEXT:**\nThe user's vehicle is a ${vehicleName}${mileage ? ` with approximately ${mileage.toLocaleString()} miles` : ""}.`;

  if (relevantIssues.length > 0) {
    context += `\n\n**KNOWN ISSUES FOR ${make.toUpperCase()} AT THIS MILEAGE — USE THIS DATA (don't default to generic advice like spark plugs/filters):**`;
    for (const issue of relevantIssues) {
      context += `\n- **${issue.issue}** (${issue.minMiles.toLocaleString()}–${issue.maxMiles.toLocaleString()} mi) | Severity: ${issue.severity} | System: ${issue.systems}`;
      context += `\n  Preventive: ${issue.preventiveCost} → If ignored: ${issue.repairCost}`;
    }
  }

  if (upcomingIssues.length > 0) {
    context += `\n\n**UPCOMING ISSUES TO WATCH FOR:**`;
    for (const issue of upcomingIssues.slice(0, 3)) {
      context += `\n- ${issue.issue} (typically ${issue.minMiles.toLocaleString()}–${issue.maxMiles.toLocaleString()} mi)`;
    }
  }

  context += `\n\n**IMPORTANT:** When Priya or Jess advises this user, reference these SPECIFIC known issues for their ${make} — do NOT fall back to generic maintenance suggestions (spark plugs, air filters, etc.) unless those are actually relevant to their vehicle's situation. Be specific and data-driven.`;

  return context;
}
