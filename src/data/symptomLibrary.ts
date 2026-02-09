export interface SymptomEntry {
  keywords: string[];
  mustMatch: string[];
  diagnosis: string;
  description: string;
  commonCauses: string[];
  urgency: "low" | "medium" | "high";
  diyFeasibility: "easy" | "moderate" | "advanced";
  costRange: { diy: string; professional: string };
  specialNote?: string;
}

export const symptomLibrary: SymptomEntry[] = [
  {
    keywords: ["squeak", "squeaking", "squeal", "squealing", "brakes", "brake", "stopping"],
    mustMatch: ["brake", "brakes", "stopping", "squeak", "squeal"],
    diagnosis: "Worn Brake Pads",
    description: "The squeaking sound when braking is most commonly caused by brake pads that have worn down to their wear indicators — small metal tabs designed to make noise when it's time for replacement.",
    commonCauses: ["Worn brake pad friction material", "Glazed or contaminated brake rotors", "Dust or debris between pad and rotor", "Cheap or low-quality brake pads"],
    urgency: "medium",
    diyFeasibility: "moderate",
    costRange: { diy: "$25–$60 per axle", professional: "$150–$350 per axle" },
  },
  {
    keywords: ["check engine", "check engine light", "engine light", "cel", "mil", "malfunction indicator"],
    mustMatch: ["engine", "light"],
    diagnosis: "Check Engine Light (Multiple Possible Causes)",
    description: "The check engine light can be triggered by hundreds of different issues, from a loose gas cap to a serious engine problem. Without reading the diagnostic trouble code stored in your vehicle's computer, it's impossible to know the specific cause.",
    commonCauses: ["Loose or damaged gas cap", "Oxygen sensor failure", "Catalytic converter issue", "Mass airflow sensor", "Spark plug or ignition coil failure"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$0–$25 (if gas cap)", professional: "$100–$1,000+ (varies widely by cause)" },
    specialNote: "We strongly recommend scanning your vehicle with an OBD2 scanner to read the specific diagnostic code. This will give you a much more accurate diagnosis. Many auto parts stores will scan your vehicle for free.",
  },
  {
    keywords: ["overheat", "overheating", "hot", "temperature", "temp gauge", "coolant", "steam", "boiling"],
    mustMatch: ["overheat", "overheating", "temperature", "coolant", "steam"],
    diagnosis: "Engine Overheating",
    description: "Your engine is running hotter than it should. This is a serious issue that can cause permanent engine damage if not addressed immediately. If your temperature gauge is in the red or you see steam from under the hood, pull over safely and turn off the engine.",
    commonCauses: ["Low coolant level or coolant leak", "Failed thermostat", "Faulty water pump", "Clogged radiator", "Failed cooling fan"],
    urgency: "high",
    diyFeasibility: "moderate",
    costRange: { diy: "$15–$50 (if thermostat/coolant)", professional: "$150–$800" },
  },
  {
    keywords: ["vibrat", "vibrating", "vibration", "shaking", "shake", "wobble", "shimmy"],
    mustMatch: ["vibrat", "shaking", "shake", "wobble", "shimmy"],
    diagnosis: "Vehicle Vibration",
    description: "Vibrations can come from several sources depending on when they occur — at certain speeds, while braking, or at idle. The most common cause of vibration at highway speeds is unbalanced or worn tires.",
    commonCauses: ["Unbalanced tires", "Worn or warped brake rotors (vibration when braking)", "Worn tire tread or tire defect", "Damaged wheel bearing", "Worn suspension components"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$0–$20 (tire balance at shop)", professional: "$50–$500 depending on cause" },
  },
  {
    keywords: ["battery", "won't start", "wont start", "dead", "no start", "click", "clicking", "crank", "cranking"],
    mustMatch: ["battery", "start", "dead", "click", "crank"],
    diagnosis: "Battery or Starting System Issue",
    description: "If your vehicle won't start or you hear clicking when turning the key, the most common cause is a dead or weak battery. Batteries typically last 3–5 years.",
    commonCauses: ["Dead or weak battery", "Corroded battery terminals", "Failed starter motor", "Faulty alternator (battery not charging)", "Loose or damaged battery cables"],
    urgency: "high",
    diyFeasibility: "easy",
    costRange: { diy: "$100–$200 (new battery)", professional: "$150–$500" },
  },
  {
    keywords: ["oil", "oil light", "oil pressure", "oil leak", "burning oil", "oil smell"],
    mustMatch: ["oil"],
    diagnosis: "Oil System Warning",
    description: "Issues with your oil system range from simply being low on oil to serious internal engine problems. If your oil pressure warning light is on, stop driving immediately — running an engine without adequate oil pressure can cause catastrophic damage within minutes.",
    commonCauses: ["Low oil level (due for oil change)", "Oil leak from gasket or seal", "Faulty oil pressure sensor", "Worn oil pump", "Internal engine wear causing oil consumption"],
    urgency: "high",
    diyFeasibility: "easy",
    costRange: { diy: "$30–$75 (oil change)", professional: "$50–$150 (oil change) to $500+ (leak repair)" },
  },
  {
    keywords: ["ac", "air conditioning", "air conditioner", "cold air", "hot air", "not cooling", "no cold", "hvac", "heat", "heater", "blowing hot"],
    mustMatch: ["ac", "air conditioning", "cooling", "cold air", "heater", "heat"],
    diagnosis: "HVAC / Air Conditioning Issue",
    description: "If your AC is blowing warm air or your heater isn't producing heat, the cause depends on which system is affected. AC issues are most commonly caused by low refrigerant, while heating issues often point to a low coolant level or a stuck blend door.",
    commonCauses: ["Low refrigerant (AC)", "Failed AC compressor", "Clogged cabin air filter", "Faulty blend door actuator", "Low coolant level (heater)"],
    urgency: "low",
    diyFeasibility: "easy",
    costRange: { diy: "$10–$40 (cabin filter or refrigerant recharge kit)", professional: "$150–$1,000" },
  },
  {
    keywords: ["tire", "tires", "flat", "tpms", "tire pressure", "low pressure", "nail", "puncture", "blowout"],
    mustMatch: ["tire", "tires", "tpms", "flat", "pressure"],
    diagnosis: "Tire Pressure / Tire Damage",
    description: "The TPMS (Tire Pressure Monitoring System) warning light means one or more tires is significantly under-inflated. This could be caused by a slow leak, a puncture, or simply cold weather causing pressure to drop.",
    commonCauses: ["Nail or screw puncture causing slow leak", "Temperature change (cold weather drops pressure)", "Damaged valve stem", "Cracked or damaged wheel rim", "Tire bead leak"],
    urgency: "medium",
    diyFeasibility: "easy",
    costRange: { diy: "$0–$5 (air fill at gas station)", professional: "$15–$30 (patch) or $100–$300 (new tire)" },
  },
  {
    keywords: ["transmission", "shifting", "gear", "gears", "slipping", "hard shift", "won't shift", "jerking", "transmission fluid"],
    mustMatch: ["transmission", "shifting", "gear", "slipping"],
    diagnosis: "Transmission Issue",
    description: "Transmission problems can range from low fluid to serious internal damage. Symptoms like slipping, hard shifting, or delayed engagement are warning signs that should be addressed promptly to prevent more expensive repairs.",
    commonCauses: ["Low or degraded transmission fluid", "Worn clutch packs or bands", "Faulty shift solenoids", "Damaged torque converter", "Transmission control module issue"],
    urgency: "high",
    diyFeasibility: "advanced",
    costRange: { diy: "$20–$50 (fluid top-off)", professional: "$150–$500 (service) to $2,000–$5,000 (rebuild/replace)" },
  },
  {
    keywords: ["noise", "grinding", "clunk", "clunking", "knock", "knocking", "rattle", "rattling", "whine", "whining", "hum", "humming", "buzz", "buzzing"],
    mustMatch: ["noise", "grinding", "clunk", "knock", "rattle", "whine", "hum", "buzz"],
    diagnosis: "Unusual Noise (Multiple Possible Causes)",
    description: "Unusual noises can come from many vehicle systems. The type of noise and when it occurs are the best clues to identifying the source. Without hearing the noise in person, we can suggest common causes, but a technician's ears-on inspection is the best path to an accurate diagnosis.",
    commonCauses: ["Worn brake components (grinding/squealing)", "Exhaust system leak or loose heat shield (rattle)", "Wheel bearing failure (humming that changes with speed)", "Power steering fluid low (whining when turning)", "Engine accessory belt worn (squealing at startup)"],
    urgency: "medium",
    diyFeasibility: "advanced",
    costRange: { diy: "Varies widely by cause", professional: "$100–$1,000+ depending on source" },
    specialNote: "Noise-based diagnoses are especially difficult without a physical inspection. We strongly recommend having a qualified technician listen to and inspect the vehicle.",
  },
];

export interface SymptomMatch {
  entry: SymptomEntry;
  score: number;
}

/**
 * Match user input against the symptom library.
 * Returns top 1–3 matches sorted by score, or empty array if none match.
 */
export function matchSymptoms(input: string): SymptomMatch[] {
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/);

  const scored: SymptomMatch[] = [];

  for (const entry of symptomLibrary) {
    // Must match at least one mustMatch keyword (supports partial/substring matching)
    const hasMust = entry.mustMatch.some((m) => lower.includes(m.toLowerCase()));
    if (!hasMust) continue;

    // Score by counting how many keywords appear in the input
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  // Sort by score descending, return top 3
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
