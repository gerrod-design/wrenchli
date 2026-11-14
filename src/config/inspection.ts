/**
 * Mobility Brief 2 — versioned inspection configuration.
 *
 * Two founder-approved configuration sets, consumed by the
 * inspection report form (ReferralPackage), the Garage record
 * (OwnerReferralStatus), and the migration replay tests:
 *
 * 1. INSPECTION_CHECKLIST — the versioned checklist the Oct 2
 *    pilot terms make the price of admission ("Wrenchli
 *    checklist & schema reporting"). Content is the APPROVED
 *    v3 checklist (inspection-checklist-v3-DRAFT-2026-11-14,
 *    approved by Gerrod 2026-11-14), which replaced the v1
 *    placeholder mechanism (12 system headings, one grade each).
 *    V3 content, all carried here as data:
 *      - 137 general items: 118 line items across the same 12
 *        systems, an 8-item read-only code scan, and an 11-item
 *        road test. Items name a measurement where the trade
 *        records one; a grade with no number where a number is
 *        named is an incomplete report.
 *      - Each item ends one of three ways: checked and fine,
 *        checked and a concern, or NOT INSPECTED with a reason
 *        from a short list. The system's grade is the worst item
 *        under it.
 *      - 50 cross-system dependency prompts (section 4 of the
 *        draft), shown when the inspector grades a system.
 *      - 13 whole-car rules (section 5), including the safety
 *        gate tying a safety-concern grade to the safe-to-drive
 *        answer.
 *      - Section 3: the vehicle-specific known-issues block —
 *        recalls and sourced pattern failures for the exact car,
 *        worked as directed checks with three marks (evidence
 *        found / no evidence found / could not check from the
 *        driveway). The block's checks are generated per job
 *        before the visit (desk work: NHTSA recall data + the
 *        sourced pattern library) and stored on the chain's
 *        inspection_details row; the format, marks, counting
 *        header, honest empty-block statement, and the draft's
 *        four worked format examples live here.
 *      - Section 6: the pre-assessment comparison block. The
 *        pre-assessment's suspected causes stay SEALED until the
 *        general + known-issues findings are filed (enforced
 *        server-side by get_referral_package_by_token — see the
 *        20261114130000 migration). Once unsealed, causes are
 *        served by name and identifier WITHOUT likelihood; the
 *        inspector marks each confirmed / not found / could not
 *        check from the driveway, and the likelihood as issued
 *        joins the filed record only after verdicts are filed,
 *        so the trust record (section 6.3) can line up suspected
 *        vs found vs shop-confirmed cause by cause.
 *      - Section 7: the honest-limits text, carried verbatim for
 *        the filed report.
 *
 *    Findings schema (inspection_reports.findings, jsonb): the
 *    per-system shape is unchanged from v1 — {system, severity,
 *    note} — and each finding now ALSO carries the per-item
 *    results under `items` (v3 requires per-item results;
 *    severity remains the system grade, derived from the worst
 *    item). Reports filed under v1 stay readable: `items` is
 *    optional and every reader tolerates its absence.
 *
 * 2. ONSITE_ELIGIBLE_JOBS — Gerrod's approved onsite-eligible
 *    list (2026-11-13, onsite-eligible-jobs draft as approved):
 *    the rule (no raising the vehicle, consumable-class work, no
 *    fluid capture beyond a drain pan) plus the job types it
 *    names. The report form records onsite work against this
 *    list; anything off-list converts to a repair referral.
 */

export const INSPECTION_CHECKLIST_VERSION = "wrenchli-inspection-checklist-v3";

export type InspectionSeverity =
  | "ok"
  | "monitor"
  | "needs_attention"
  | "safety_concern";

export const INSPECTION_SEVERITIES: Array<{
  value: InspectionSeverity;
  label: string;
}> = [
  { value: "ok", label: "OK" },
  { value: "monitor", label: "Monitor" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "safety_concern", label: "Safety concern" },
];

const SEVERITY_RANK: Record<InspectionSeverity, number> = {
  ok: 0,
  monitor: 1,
  needs_attention: 2,
  safety_concern: 3,
};

/** How a single checklist item ends (v3 section 1). */
export type InspectionItemStatus =
  | "checked_ok"
  | "concern"
  | "not_inspected";

export const INSPECTION_ITEM_STATUSES: Array<{
  value: InspectionItemStatus;
  label: string;
}> = [
  { value: "checked_ok", label: "Checked — fine" },
  { value: "concern", label: "Checked — concern" },
  { value: "not_inspected", label: "Not inspected" },
];

/** The short list of not-inspected reasons (v3 section 1). */
export type NotInspectedReason =
  | "needs_lift"
  | "needs_wheel_off"
  | "hidden_by_cover"
  | "engine_too_hot"
  | "no_access"
  | "not_fitted";

export const NOT_INSPECTED_REASONS: Array<{
  value: NotInspectedReason;
  label: string;
}> = [
  { value: "needs_lift", label: "Needs a lift" },
  { value: "needs_wheel_off", label: "Needs a wheel off" },
  { value: "hidden_by_cover", label: "Hidden by a cover" },
  { value: "engine_too_hot", label: "Engine too hot" },
  { value: "no_access", label: "No access" },
  { value: "not_fitted", label: "Not fitted to this car" },
];

export interface InspectionItemDefinition {
  /** Stable id, "<section key>-<n>", e.g. "brakes-4". */
  id: string;
  /** The check, in the draft's words (trimmed only for length). */
  text: string;
  /**
   * The measurement the trade records for this item, where the
   * draft names one. A filed result for this item carries the
   * recorded value in `measurement`.
   */
  measurement?: string;
  /**
   * Core measurement item for whole-car rule 5: if this item is
   * not inspected, its system cannot be graded OK (best is
   * Monitor, with the item named).
   */
  core?: boolean;
  /**
   * Standing not-inspected note: for some cars/visits this item
   * is not inspected by design (draft names it in every report).
   */
  standingNotInspected?: string;
}

export interface InspectionSectionDefinition {
  key: string;
  label: string;
  kind: "system" | "code_scan" | "road_test";
  approxMinutes?: number;
  items: InspectionItemDefinition[];
}

export type InspectionSystemDefinition = InspectionSectionDefinition;

/** Shorthand builders so the item lists below stay readable. */
function item(
  section: string,
  n: number,
  text: string,
  extra?: Partial<Omit<InspectionItemDefinition, "id" | "text">>,
): InspectionItemDefinition {
  return { id: `${section}-${n}`, text, ...(extra ?? {}) };
}

const ENGINE_ITEMS: InspectionItemDefinition[] = [
  item("engine", 1, "Cold start: how it catches, and any knock, timing chain rattle, lifter tick, or belt squeal in the first seconds."),
  item("engine", 2, "Smoke at start, idle, and a gentle rev: color written down (blue usually means oil, white usually means coolant, black usually means too much fuel)."),
  item("engine", 3, "Idle quality: smooth or rough, surging, hunting, near-stall, excess vibration."),
  item("engine", 4, "Engine oil: dipstick level, and condition — color, milky traces, fuel smell, metal sparkle."),
  item("engine", 5, "Engine air filter: dirt load, oil soaking, housing sealed."),
  item("engine", 6, "Serpentine belt: cracks, glazing, fraying, edge wear, squeal."),
  item("engine", 7, "Hoses visible from above: swelling, cracks, soft or rock-hard feel, clamp seepage."),
  item("engine", 8, "Oil leaks visible from above: valve covers, front seals, around the oil cap and filter where reachable."),
  item("engine", 9, "Engine mounts: visible cracking, and engine rock on a gentle rev where it is safe to do."),
  item("engine", 10, "Throttle response at a standstill: hesitation, stumble, or surge."),
  item("engine", 11, "Smells in the engine bay: burning oil, raw fuel, sweet coolant."),
  item("engine", 12, "Non-factory wiring, missing caps or covers, chewed insulation or other rodent signs."),
];

const TRANSMISSION_ITEMS: InspectionItemDefinition[] = [
  item("transmission_drivetrain", 1, "Transmission fluid where a dipstick is fitted: level, color (red/pink is healthy; brown or black is not), burnt smell.", {
    standingNotInspected: "Sealed units with no dipstick are marked not inspected for fluid, in those words.",
  }),
  item("transmission_drivetrain", 2, "Engagement: Park to Drive and Park to Reverse — delay, clunk, or shudder noted."),
  item("transmission_drivetrain", 3, "Case and pan leaks visible from ground level."),
  item("transmission_drivetrain", 4, "Axle seals and CV boots where visible: torn boots, slung grease."),
  item("transmission_drivetrain", 5, "Driveshaft and U-joints where visible (rear-wheel and all-wheel drive): damage, slung grease, missing weights."),
  item("transmission_drivetrain", 6, "Transfer case leaks where fitted."),
  item("transmission_drivetrain", 7, "All-wheel / four-wheel drive engagement lights and any warning messages."),
  item("transmission_drivetrain", 8, "Cooler lines visible from above or ground level: seepage, chafe."),
  item("transmission_drivetrain", 9, "Shift quality — scored from the road test, never from the driveway alone."),
];

const BRAKES_ITEMS: InspectionItemDefinition[] = [
  item("brakes", 1, "Brake fluid: level, color, and moisture reading where a tester is carried. Moisture at about 3% or more means the fluid needs changing.", {
    measurement: "Brake fluid moisture (%)",
  }),
  item("brakes", 2, "Pedal feel: height, firmness, and whether the pedal sinks slowly under steady pressure. A sinking pedal is a safety concern."),
  item("brakes", 3, "Parking brake: holds the car, lever or pedal travel not excessive."),
  item("brakes", 4, "Pad thickness measured where it can be seen without taking a wheel off, for the thinnest pad on each axle. New pads are roughly 10–12 mm; at about 3 mm they are at the replacement point. Where the pad cannot be seen, the item is not inspected — never estimated, never guessed.", {
    measurement: "Thinnest pad per axle (mm)",
    core: true,
  }),
  item("brakes", 5, "Rotor surface where visible: deep scoring, a wear lip, heavy rust bands, blue heat marks."),
  item("brakes", 6, "Calipers where visible: seepage, and signs one pad is wearing much faster than its pair."),
  item("brakes", 7, "Brake lines and flex hoses where visible: rust, chafing, seepage."),
  item("brakes", 8, "ABS light: on at key-on, out after start. A light that stays on is recorded as a finding, not a footnote."),
  item("brakes", 9, "Rear drum brakes where fitted: the lining is hidden behind the drum and cannot be checked without taking the drum off.", {
    standingNotInspected: "Standing not inspected item for every car with rear drums, named in every such report.",
  }),
  item("brakes", 10, "Braking on the road test: pull, pulsation, noise, pedal feel, stops straight."),
];

const STEERING_ITEMS: InspectionItemDefinition[] = [
  item("steering_suspension", 1, "Steering free play at the wheel before the road wheels start to move."),
  item("steering_suspension", 2, "Lock to lock at a standstill: binding, groaning, clunks, tight spots."),
  item("steering_suspension", 3, "Power steering fluid level and condition where a reservoir exists; electric steering warning light where it does not."),
  item("steering_suspension", 4, "Shocks and struts: visible oil leakage, damaged dust boots."),
  item("steering_suspension", 5, "Springs: broken coil visible, and ride height compared side to side."),
  item("steering_suspension", 6, "Tie rod and ball joint boots where visible: torn, grease gone."),
  item("steering_suspension", 7, "Control arm bushings where visible from ground level: cracking, separation."),
  item("steering_suspension", 8, "Sway bar links where visible: broken, boots gone, play by hand."),
  item("steering_suspension", 9, "Steering center and pull — scored on the road test."),
  item("steering_suspension", 10, "Joint play under load (ball joints, tie rods, bearings) needs the car raised and loaded properly. Noise and wear evidence from the road test and tires stands in, labeled as evidence, not measurement.", {
    standingNotInspected: "Curbside, this is not inspected and the report says so.",
  }),
];

const TIRES_ITEMS: InspectionItemDefinition[] = [
  item("tires_wheels", 1, "Tread depth with a gauge, at the shallowest groove, recorded per tire (left front, right front, left rear, right rear) and for the spare. Where wear is uneven, inner, center, and outer readings are all written. Guide: 6/32 or more is healthy; 4–5/32 plan replacement soon; 3/32 needs attention; 2/32 is the legal floor in most states and is a safety concern, as is any reading at the wear bars.", {
    measurement: "Tread depth at shallowest groove (32nds of an inch)",
    core: true,
  }),
  item("tires_wheels", 2, "Pressure in each tire before any adjustment, against the door placard number (not the number on the tire).", {
    measurement: "Tire pressure before adjustment (psi)",
  }),
  item("tires_wheels", 3, "Wear pattern per tire: even, center-only, both edges, one shoulder only, cupping, or feathering. The pattern is evidence for the dependency prompts — it is never graded and forgotten."),
  item("tires_wheels", 4, "Sidewalls: bulges (a bulge is a safety concern), cuts, cracks, dry rot, repairs."),
  item("tires_wheels", 5, "Tire age from the DOT date code on each tire, written down. Over about 6 years old is flagged even with good tread; cracking from age is graded on condition, not depth.", {
    measurement: "DOT date code per tire",
  }),
  item("tires_wheels", 6, "Sizes and brands matched across each axle, and the right size for the car."),
  item("tires_wheels", 7, "Wheels: bends, cracks, heavy corrosion, missing or incorrect lug nuts."),
  item("tires_wheels", 8, "TPMS light: state before and after pressures are set."),
  item("tires_wheels", 9, "Spare (inflated, usable, or absent), jack, tools, and the locking-nut key where fitted."),
];

const ELECTRICAL_ITEMS: InspectionItemDefinition[] = [
  item("electrical_battery", 1, "Battery resting voltage, written down in volts. A charged, healthy battery reads about 12.6–12.8 V; about 12.4 V is roughly three-quarters charged; below about 12.2 V is discharged.", {
    measurement: "Battery resting voltage (V)",
    core: true,
  }),
  item("electrical_battery", 2, "Electronic battery test against the cold-cranking-amps number on the battery's own label, where a tester is carried. Result written down; a photo of the tester screen or printout goes in the report.", {
    measurement: "Battery test result (measured CCA vs label CCA)",
  }),
  item("electrical_battery", 3, "Battery age from its date code, and case condition: swelling, cracks, leakage.", {
    measurement: "Battery date code",
  }),
  item("electrical_battery", 4, "Terminals: corrosion, tightness, damaged cable ends."),
  item("electrical_battery", 5, "Hold-down: present and tight. A loose battery is a finding, not a detail."),
  item("electrical_battery", 6, "Charging voltage at idle, written down. Healthy is roughly 13.8–14.7 V.", {
    measurement: "Charging voltage at idle (V)",
    core: true,
  }),
  item("electrical_battery", 7, "Charging voltage under load — lights, blower, and rear defroster on. It should hold above about 13.5 V.", {
    measurement: "Charging voltage under load (V)",
  }),
  item("electrical_battery", 8, "Cranking: speed and sound of the starter, any click-only or slow-crank events."),
  item("electrical_battery", 9, "Dash bulb check: every warning light comes on at key-on and goes out after start. Any light that never comes on, or stays on, is written down by name."),
  item("electrical_battery", 10, "Airbag (SRS) light: on at key-on, out after start. One that stays on is a safety finding and follows the whole-car rules."),
  item("electrical_battery", 11, "Power windows, locks, mirrors, and seats: each one operated, not assumed."),
  item("electrical_battery", 12, "Horn: works."),
  item("electrical_battery", 13, "Aftermarket wiring and accessories: non-factory splices, added alarms or amps, anything that suggests a slow battery drain."),
];

const COOLING_ITEMS: InspectionItemDefinition[] = [
  item("cooling", 1, "Coolant level in the reservoir, engine cold, against the min/max marks."),
  item("cooling", 2, "Coolant condition: correct color for the car, rust, debris, or an oil sheen on top."),
  item("cooling", 3, "Radiator cap seal and condition — cold engine only. A pressurized cap is never opened hot; if the engine cannot cool during the visit, this item is not inspected and says why."),
  item("cooling", 4, "Radiator and heater hoses where visible: swelling, cracks, collapse, clamp seepage."),
  item("cooling", 5, "Radiator face where visible: leaks, bent fins, corrosion, blockage."),
  item("cooling", 6, "Cooling fan: runs when it should (with the air conditioning on is the usual trigger)."),
  item("cooling", 7, "Water pump: visible seepage at the weep hole, bearing noise."),
  item("cooling", 8, "Temperature gauge behavior at idle and again after the road test: reaches normal, stays there, no creep."),
  item("cooling", 9, "Signs of stop-leak products or past overheating repairs: sealant residue in the reservoir, mismatched new parts, warped or stained surfaces."),
];

const EXHAUST_ITEMS: InspectionItemDefinition[] = [
  item("exhaust", 1, "Cold-start sound: manifold tick (often fades as it warms), excessive overall noise."),
  item("exhaust", 2, "Pipe and muffler sections visible from ground level: rust-through, holes, crushed sections."),
  item("exhaust", 3, "Hangers and mounts: broken, stretched, pipe hanging low."),
  item("exhaust", 4, "Catalytic converter: present, intact, no fresh cut or weld marks from theft or a cheap repair; heat shields secure, no rattle."),
  item("exhaust", 5, "Tailpipe deposits: heavy black soot supports a rich-running finding in Engine; smoke color cross-checked against Engine, item 2."),
  item("exhaust", 6, "Exhaust smell in or around the cabin at idle — a safety finding if fumes are entering the car."),
  item("exhaust", 7, "The rest of the underside run of the system cannot be seen from the ground. Only the visible sections are graded.", {
    standingNotInspected: "The report names the system as partly not inspected underneath, every time.",
  }),
];

const FLUIDS_ITEMS: InspectionItemDefinition[] = [
  item("fluids_leaks", 1, "Ground survey before the car is moved: every drip and stain under the car mapped by position (front/middle/rear, left/right) and described by color and feel — black or brown usually oil, colored and sweet usually coolant, red or brown usually transmission or power steering fluid, clear-yellow usually brake fluid, anything that smells of fuel is treated as fuel."),
  item("fluids_leaks", 2, "Fresh drip check after the road test, same map. A leak that only shows under pressure or heat is still a leak."),
  item("fluids_leaks", 3, "Oil pan and drain plug area where visible: wetness, drip formation."),
  item("fluids_leaks", 4, "Transmission pan and case seams where visible: wetness."),
  item("fluids_leaks", 5, "Differential and axle seal areas where visible: wetness, slung fluid."),
  item("fluids_leaks", 6, "Steering rack boots and power steering lines where visible: wetness, torn boots."),
  item("fluids_leaks", 7, "Fuel: any smell of fuel around lines, tank, or filler, and any visible seepage. An active fuel leak is a safety concern and stops the road test."),
  item("fluids_leaks", 8, "Windshield washer fluid: level, and the washers actually work (checked with Lights and signals, item 10)."),
  item("fluids_leaks", 9, "Old leak or active leak: the report says which. Dry grime is history; wet and fresh is a leak happening now. Each active leak names the system it belongs to so its fluid level is read in the same report."),
];

const LIGHTS_ITEMS: InspectionItemDefinition[] = [
  item("lights_signals", 1, "Headlights, low beam, both sides."),
  item("lights_signals", 2, "High beam and flash-to-pass."),
  item("lights_signals", 3, "Daytime running lights where fitted."),
  item("lights_signals", 4, "Turn signals: front, rear, and side, both sides, plus the dash indicator speed — a fast flash means a bulb or circuit fault and is written down."),
  item("lights_signals", 5, "Brake lights, all of them including the high-mounted light, with the pedal held."),
  item("lights_signals", 6, "Reverse lights."),
  item("lights_signals", 7, "License plate light, and hazard flashers all around."),
  item("lights_signals", 8, "Fog lights where fitted."),
  item("lights_signals", 9, "Lens condition: cracks, moisture inside the housing, heavy clouding."),
  item("lights_signals", 10, "Wipers on every speed plus washers, front and rear where fitted, and blade condition — streaking, chatter, torn rubber."),
];

const HVAC_ITEMS: InspectionItemDefinition[] = [
  item("hvac", 1, "Air conditioning vent temperature measured with a thermometer and written down in degrees, with the outside temperature noted beside it. As a plain guide, healthy output is clearly cold — roughly 25–30 degrees below the air outside. A number replaces \"feels cold.\"", {
    measurement: "Vent temperature (degrees) and outside temperature (degrees)",
  }),
  item("hvac", 2, "Compressor engagement: clutch cycles, no grinding or squeal."),
  item("hvac", 3, "Heat: output genuinely hot at full heat setting."),
  item("hvac", 4, "Blower: every speed works, no resistor dropouts, no bearing noise."),
  item("hvac", 5, "Mode controls: air actually moves to floor, dash, and defrost. Defrost is a safety item in winter, not a comfort item."),
  item("hvac", 6, "Cabin filter where it can be reached by hand (glove box designs): condition noted."),
  item("hvac", 7, "Musty or mold smell, and carpet dampness — cross-checked against the flood signs in Body and glass."),
];

const BODY_ITEMS: InspectionItemDefinition[] = [
  item("body_glass", 1, "Every panel walked and graded: dents, scratches, rust, with wheel arches and rocker panels looked at closely — they rust first."),
  item("body_glass", 2, "Paint match panel to panel, and signs of past repair: overspray on trim, filler edges, orange-peel differences."),
  item("body_glass", 3, "Paint thickness readings per panel where a gauge is carried: one panel reading far above its neighbors means filler and past damage, and it is written down.", {
    measurement: "Paint thickness per panel",
  }),
  item("body_glass", 4, "Panel gaps and alignment: even, or shifted on one corner — a shifted corner points at the suspension and steering on that side."),
  item("body_glass", 5, "Windshield: chips and cracks, and whether any crack sits in the driver's direct view — that is a safety concern."),
  item("body_glass", 6, "All other glass: condition and operation."),
  item("body_glass", 7, "Mirrors: glass intact, adjustment works, housings secure."),
  item("body_glass", 8, "Doors, hood, trunk or tailgate: open, close, latch; hood safety catch works."),
  item("body_glass", 9, "Weatherstripping: torn, crushed, or missing — water gets in past bad seals."),
  item("body_glass", 10, "Flood and water signs: silt or a waterline under carpets and in the spare tire well, corrosion on seat rails and under-dash connectors, musty smell that does not match the weather."),
  item("body_glass", 11, "Spare tire well: dry or wet, rust started or not."),
  item("body_glass", 12, "VIN plate at the windshield: readable, and matches the paperwork the owner provided."),
  item("body_glass", 13, "Rust at the visible underbody edges from ground level: subframe mounting points, pinch welds, floor edges. What the ground view cannot reach is covered by the report's stated limits."),
];

const CODE_SCAN_ITEMS: InspectionItemDefinition[] = [
  item("code_scan", 1, "Scanner connects and talks to the car; any port or power problem is written down, not worked around silently."),
  item("code_scan", 2, "Stored codes, written down word for word — the code number and its plain meaning — across engine, transmission, ABS, and airbag systems where the scanner can reach them."),
  item("code_scan", 3, "Pending codes (faults the car has seen but not yet confirmed): written down separately, labeled pending."),
  item("code_scan", 4, "Permanent codes where the scanner shows them: written down."),
  item("code_scan", 5, "Readiness monitors: how many show complete and how many incomplete. Several incomplete monitors together with no stored codes is the standard sign codes may have been cleared recently — recorded as a flag (\"monitors not ready, recent clearing possible\"), never as an accusation."),
  item("code_scan", 6, "Freeze-frame data for the lead code where the car stored it: speed, temperature, and load when the fault set."),
  item("code_scan", 7, "Lights versus scan agreement: every dash light that is on should have a code behind it, and a serious code with no light is also a finding. A mismatch either way is written down and explained."),
  item("code_scan", 8, "Battery-disconnect signs: clock reset, lost radio presets, monitors all incomplete together — recorded with item 5."),
];

const ROAD_TEST_ITEMS: InspectionItemDefinition[] = [
  item("road_test", 1, "Engagement and first movement: delay, clunk, shudder pulling away."),
  item("road_test", 2, "Acceleration: power feels right, no hesitation, no misfire under load."),
  item("road_test", 3, "Shifts through every gear: slips, flares, late or harsh shifts, converter shudder. On a manual: clutch bite point, grinding, slipping under load."),
  item("road_test", 4, "Braking from moderate speed, more than once: pull, pulsation, noise, pedal feel, and whether it stops straight."),
  item("road_test", 5, "Steering at speed: wheel centered, drift or pull, vibration (with the speed where it happens written down), return to center after a turn."),
  item("road_test", 6, "Bumps and corners: knocks or clunks, excess body roll, and wheel bearing hum that changes as steering loads one side then the other."),
  item("road_test", 7, "Temperature gauge through the drive: stable at normal, no creep in traffic."),
  item("road_test", 8, "Heat and air conditioning under real load, not just at idle."),
  item("road_test", 9, "Cruise control where it is safe and legal to use."),
  item("road_test", 10, "Driveline sounds: whine or vibration that changes between power and coasting."),
  item("road_test", 11, "Back at the car: the after-test leak check (Fluids and leaks, item 2) and any new smells — burning oil, coolant, brakes."),
];

export const INSPECTION_SYSTEMS: InspectionSectionDefinition[] = [
  { key: "engine", label: "Engine", kind: "system", approxMinutes: 9, items: ENGINE_ITEMS },
  { key: "transmission_drivetrain", label: "Transmission and drivetrain", kind: "system", approxMinutes: 4, items: TRANSMISSION_ITEMS },
  { key: "brakes", label: "Brakes", kind: "system", approxMinutes: 7, items: BRAKES_ITEMS },
  { key: "steering_suspension", label: "Steering and suspension", kind: "system", approxMinutes: 6, items: STEERING_ITEMS },
  { key: "tires_wheels", label: "Tires and wheels", kind: "system", approxMinutes: 8, items: TIRES_ITEMS },
  { key: "electrical_battery", label: "Electrical and battery", kind: "system", approxMinutes: 9, items: ELECTRICAL_ITEMS },
  { key: "cooling", label: "Cooling system", kind: "system", approxMinutes: 4, items: COOLING_ITEMS },
  { key: "exhaust", label: "Exhaust", kind: "system", approxMinutes: 3, items: EXHAUST_ITEMS },
  { key: "fluids_leaks", label: "Fluids and leaks", kind: "system", approxMinutes: 5, items: FLUIDS_ITEMS },
  { key: "lights_signals", label: "Lights and signals", kind: "system", approxMinutes: 4, items: LIGHTS_ITEMS },
  { key: "hvac", label: "Heating and air conditioning", kind: "system", approxMinutes: 3, items: HVAC_ITEMS },
  { key: "body_glass", label: "Body and glass", kind: "system", approxMinutes: 8, items: BODY_ITEMS },
];

export const INSPECTION_CODE_SCAN: InspectionSectionDefinition = {
  key: "code_scan",
  label: "Code scan (OBD)",
  kind: "code_scan",
  approxMinutes: 6,
  items: CODE_SCAN_ITEMS,
};

export const INSPECTION_ROAD_TEST: InspectionSectionDefinition = {
  key: "road_test",
  label: "Road test",
  kind: "road_test",
  approxMinutes: 12,
  items: ROAD_TEST_ITEMS,
};

/** All 14 general-checklist sections, in the order worked. */
export const INSPECTION_SECTIONS: InspectionSectionDefinition[] = [
  ...INSPECTION_SYSTEMS,
  INSPECTION_CODE_SCAN,
  INSPECTION_ROAD_TEST,
];

/** Total general items: 118 system items + 8 code scan + 11 road test = 137. */
export const INSPECTION_GENERAL_ITEM_COUNT = INSPECTION_SECTIONS.reduce(
  (n, s) => n + s.items.length,
  0,
);

export function inspectionSection(key: string): InspectionSectionDefinition | null {
  return INSPECTION_SECTIONS.find((s) => s.key === key) ?? null;
}

export function inspectionItemLabel(itemId: string): string | null {
  for (const section of INSPECTION_SECTIONS) {
    const found = section.items.find((i) => i.id === itemId);
    if (found) return found.text;
  }
  return null;
}

/**
 * Cross-system dependency prompts (v3 section 4) — 50 prompts.
 * Written as questions shown when the inspector grades the
 * system they belong to: "you found this here — did you look
 * there?" Answering one takes seconds: look, or write why it
 * does not apply. They are prompts, not extra grades.
 */
export const INSPECTION_DEPENDENCY_PROMPTS: Record<string, string[]> = {
  engine: [
    "Rough idle or a misfire? Read the code scan before grading, and grade Exhaust too — a misfire sends unburned fuel into the catalytic converter and can destroy it.",
    "Blue smoke or oil use? Check the oil level trend in this report and the tailpipe deposits in Exhaust; grade them from the same evidence.",
    "Sweet smell or coolant crust anywhere in the bay? The Cooling grade must reflect it — a cooling finding never lives only in Engine.",
    "Belt worn or noisy? The same belt drives the alternator and often the water pump and power steering pump: check charging voltage (Electrical), fan and temperature behavior (Cooling), and steering effort (Steering).",
    "Knock, or metal sparkle in the oil? That is internal engine wear. The inspection cannot see inside the engine — say so, and make the recommended next step a shop diagnosis, not a guess.",
  ],
  transmission_drivetrain: [
    "Dark or burnt fluid? The road test shift grade decides this system's grade — never grade the transmission from fluid alone.",
    "A clunk on engagement? Check engine and transmission mounts (Engine, item 9) before blaming the gearbox.",
    "A leak at the bell housing? It may be transmission fluid or the engine's rear main seal. Fluids and leaks names it \"source not yet separated\" instead of guessing.",
    "Shift problems with healthy fluid? Read the scan for transmission codes before grading — many shift faults are electronic, not mechanical.",
  ],
  brakes: [
    "Low brake fluid and thin pads? They travel together — fluid level falls as pads wear. Check both before calling either a leak or a failure.",
    "Pulsation when braking? Rotors are the first suspect, but confirm against tire condition and the road test bearing check before grading.",
    "Pull when braking? A sticking caliper or a collapsing hose — but check tire pressures first. Unequal pressures pull too, and they are free to rule out.",
    "Spongy pedal and high fluid moisture? That is hydraulic health, not pad wear. Grade the system on the hydraulics.",
  ],
  steering_suspension: [
    "One-shoulder tire wear? This grade and the Tires grade must tell the same story. If they disagree, the report is not finished.",
    "Clunk over bumps? Rule out engine mounts and exhaust hangers before grading suspension parts as failed.",
    "Steering groan or stiffness? Check power steering fluid level (this system, item 3) and belt condition (Engine) before grading the pump or rack.",
    "Wear pattern says alignment, but the car is curbside? Alignment cannot be verified without a rack. The recommended next step names a shop alignment check — the report never claims an alignment was measured.",
  ],
  tires_wheels: [
    "Center-only wear means it ran over-inflated; both edges means under-inflated. Write the history, not just the depth.",
    "One shoulder worn means alignment or suspension — Steering and suspension gets the prompt, every time.",
    "Cupping or scalloped wear means worn shocks or struts. Grade Steering and suspension from it.",
    "Vibration at speed? Tire balance, a bent wheel, and a wheel bearing all feel similar. The road test separates them: a bearing hum changes with steering load, balance vibration does not.",
    "Mismatched tire sizes on an all-wheel-drive car? Flag it in Transmission — mixed sizes wear the driveline. Old tires with deep tread are still old: age and cracking are graded on their own, not forgiven by depth.",
  ],
  electrical_battery: [
    "Low voltage in this car? Grade this system first. Low voltage makes warning lights and module codes lie, so every other electrical-looking finding is suspected, not confirmed, until voltage is right.",
    "Weak charging? A good battery will test bad in a car that undercharges. Grade charging before battery, always in that order.",
    "Several unrelated warning lights on together? Suspect voltage or a bad ground before suspecting several failed parts at once.",
    "Slow crank? Separate the three usual causes with evidence: battery test (this system), terminal condition (this system), and crank sound. Write which one the evidence points to.",
    "Airbag light on? It is never cleared, never ignored, and never buried in a note — it follows the safety rules in the whole-car rules.",
  ],
  cooling: [
    "Coolant low? Find where it went (Fluids and leaks) before grading. Topping up is not a finding; the leak is.",
    "Low coolant and milky oil? Together they point at a head gasket. Neither one alone proves it; both together must be named in the summary and the next step.",
    "Fan not running? That is also an Electrical finding (motor, relay, fuse), and it will make the air conditioning weak too — HVAC is graded with it in mind.",
    "Stop-leak residue found? Heater cores and radiators clog after it. Check heat output (Heating and air conditioning, item 3) before grading either system OK.",
  ],
  exhaust: [
    "Heavy black soot or a fuel smell? Look upstream: rich running lives in Engine and the code scan. The tailpipe is the messenger.",
    "Converter fault code or a dead converter? Converters usually die from an engine problem — misfire or rich running — not from old age alone. The report names the upstream suspect, so the owner does not pay for a second converter to be killed the same way.",
    "Manifold tick that fades as the car warms? Gasket or stud, noted as such — common, graded on noise and any fume entry, not inflated.",
    "Cut or freshly welded converter sections? Check the oxygen sensor wiring (Electrical) — theft repairs often leave it damaged.",
  ],
  fluids_leaks: [
    "Every active leak names its system, and that system's fluid level is read in this same visit. A leak with no level reading is an unfinished finding.",
    "Stain position is evidence: front, middle, or rear of the car, left or right. Match the stain to what sits above it before naming a source.",
    "Two fluids low together? Look for one shared cause before writing two separate problems — coolant plus oil points at the head gasket question; brake fluid plus thin pads is normal wear, and the report says that too.",
    "Active fuel leak? Safety concern, full stop. No road test, and it follows the safe-to-drive rule in the whole-car rules.",
    "Wet-and-fresh outranks dry grime. The report grades the active leak and lists the old staining as history.",
  ],
  lights_signals: [
    "Several lights out on one side or one corner? Suspect the socket, ground, or fuse before several bulbs. One bulb is a bulb; a pattern is a circuit.",
    "Moisture inside a lens? The seal has failed. Bulb life and reflector damage follow — grade the housing, not just today's bulb.",
    "Both headlights dim? Read charging voltage (Electrical) before grading bulbs or lenses.",
  ],
  hvac: [
    "Weak air conditioning? Check the cooling fan first (Cooling), then the scan. Refrigerant work is shop-only under the pilot rules, so the report points there instead of guessing at charge level.",
    "No heat? Check coolant level and temperature behavior (Cooling) before the heater core — low coolant and a stuck thermostat are the common causes.",
    "Musty smell or damp carpet? That is also a Body and glass question — flood signs and a blocked A/C drain look alike from the driver's seat, and the report checks both.",
  ],
  body_glass: [
    "One corner's paint or gaps say past repair? Give the steering, suspension, and tire wear on that same side a second look — impacts bend things the eye cannot see from outside.",
    "Flood signs found? The hidden cost is electrical: connectors and modules corrode for months afterward. The code scan becomes mandatory evidence, and Electrical is graded knowing it.",
    "Rust at rocker panels or subframe mounting points? That is structure, not cosmetics — cross-check the Steering and suspension mounting areas and grade accordingly.",
    "Crack in the driver's view? Graded as a safety concern, and the wiper blades that may have caused the wear pattern get graded with it.",
  ],
};

export const INSPECTION_DEPENDENCY_PROMPT_COUNT = Object.values(
  INSPECTION_DEPENDENCY_PROMPTS,
).reduce((n, list) => n + list.length, 0);

/**
 * Whole-car rules (v3 section 5) — the report checks itself
 * against these before it can be filed. Rules 1–10 are v2's;
 * rules 11–13 are v3's, covering the known-issues and
 * comparison blocks. The form enforces rule 1 (the safety
 * gate) and rule 5 (no OK on an unseen core item) in code;
 * the rest are carried as the standing text the report is
 * filed against.
 */
export const INSPECTION_WHOLE_CAR_RULES: Array<{
  n: number;
  title: string;
  text: string;
}> = [
  {
    n: 1,
    title: "The safety gate",
    text: "If Brakes, Steering and suspension, or Tires and wheels is graded Safety concern, then \"safe to drive\" must be No — unless the inspector writes, in his own words, why this specific car is safe to drive anyway. That written reason appears in the owner's summary, not buried in a note. The same rule applies to an active fuel leak (Fluids and leaks) and to exhaust fumes entering the cabin (Exhaust).",
  },
  {
    n: 2,
    title: "Airbag rule",
    text: "An airbag light that stays on, or an airbag code in the scan, is always named in the owner's summary as its own line. It is never only a note inside Electrical.",
  },
  {
    n: 3,
    title: "First problem first",
    text: "If any system is graded Safety concern, the recommended next step must name that system first. The most dangerous finding leads the report.",
  },
  {
    n: 4,
    title: "Not-inspected honesty",
    text: "Any item marked not inspected that the owner would reasonably expect to be covered — brake pad measurement, rear drum linings, the underside of the exhaust, transmission fluid in a sealed unit, the radiator cap on a hot engine, suspension joint play, a road test that did not happen — is named in plain words in the owner's summary under \"Not inspected on this visit.\" Silence is not allowed to read as a pass.",
  },
  {
    n: 5,
    title: "No OK on an unseen core item",
    text: "If the core measurement item of a system was not inspected (pads for Brakes, tread for Tires, voltage and charging for Electrical), that system cannot be graded OK. The best it can be is Monitor, with the not-inspected item named in its note.",
  },
  {
    n: 6,
    title: "Lights and codes must agree",
    text: "A dash light with no code, or a serious code with no light, must be explained in the report. An unexplained mismatch makes the report incomplete.",
  },
  {
    n: 7,
    title: "Leaks and levels travel together",
    text: "An active leak filed without the matching fluid level breaks the leak-and-level prompt (Fluids and leaks, prompt 1) and the report is incomplete until both are present.",
  },
  {
    n: 8,
    title: "No road test, no driving claims",
    text: "If the road test was not performed, the summary says so in plain words, and \"safe to drive\" is answered from the driveway checks alone, labeled that way.",
  },
  {
    n: 9,
    title: "Numbers or it did not happen",
    text: "Where the checklist names a measurement — tread depth, pad thickness, resting and charging voltage, brake fluid moisture, vent temperature, coolant and fluid levels — the number is in the report. A grade standing where a number belongs makes the report incomplete.",
  },
  {
    n: 10,
    title: "Photos or it did not happen",
    text: "Every Needs attention and Safety concern finding carries at least one photo, including a photo of the battery tester result where a test was run. This is the pilot terms' photo requirement, enforced.",
  },
  {
    n: 11,
    title: "Known-issues completeness",
    text: "Every recall and pattern item in the vehicle-specific block carries one of its three marks (evidence found / no evidence found / could not check from the driveway) with the evidence or the reason written beside the mark. An unmarked item makes the report incomplete, the same as a missing measurement under rule 9.",
  },
  {
    n: 12,
    title: "Comparison completeness",
    text: "Every suspected cause in the comparison block carries a verdict and its evidence note before the report can be filed. Verdicts are filed before the pre-assessment's likelihood figures are shown to anyone reviewing the report — the record must show the inspector judged the evidence first.",
  },
  {
    n: 13,
    title: "Pattern honesty",
    text: "A pattern check marked \"no evidence found\" is reported to the owner in those words — \"no evidence of this problem was found on this visit\" — never as \"your car does not have this problem.\" A directed look that finds nothing lowers suspicion; it does not close the question, and the wording never pretends it does.",
  },
];

/** One per-item result, as stored inside an InspectionFinding. */
export interface InspectionItemResult {
  /** Item id from the section definition, e.g. "brakes-4". */
  item: string;
  status: InspectionItemStatus;
  /** Required when status is "concern": how bad the concern is. */
  severity?: InspectionSeverity;
  /** The recorded number, when the item names a measurement. */
  measurement?: string;
  note?: string;
  /** Required when status is "not_inspected". */
  notInspectedReason?: NotInspectedReason;
}

/** One per-system finding, as stored in inspection_reports.findings. */
export interface InspectionFinding {
  system: string;
  severity: InspectionSeverity;
  note: string;
  /**
   * Per-item results against the checklist version's items
   * (v3). Optional so v1-filed reports stay readable.
   */
  items?: InspectionItemResult[];
}

/**
 * Derive a section's grade from its item results (v3 section
 * 1): the grade is the worst item under it, and whole-car
 * rule 5 caps a system at Monitor when a core measurement
 * item was not inspected and nothing worse was found.
 */
export function deriveSectionSeverity(
  section: InspectionSectionDefinition,
  items: InspectionItemResult[] | undefined,
): InspectionSeverity {
  if (!items || items.length === 0) return "ok";
  let worst: InspectionSeverity = "ok";
  for (const result of items) {
    if (result.status === "concern") {
      const sev = result.severity ?? "needs_attention";
      if (SEVERITY_RANK[sev] > SEVERITY_RANK[worst]) worst = sev;
    }
  }
  if (worst === "ok") {
    const coreUnseen = section.items.some(
      (def) =>
        def.core &&
        items.some(
          (r) => r.item === def.id && r.status === "not_inspected",
        ),
    );
    if (coreUnseen) return "monitor";
  }
  return worst;
}

/** Systems whose safety-concern grade trips whole-car rule 1. */
export const SAFETY_GATE_SYSTEMS = [
  "brakes",
  "steering_suspension",
  "tires_wheels",
] as const;

/**
 * Items that also trip rule 1 on their own: an active fuel
 * leak (Fluids and leaks, item 7) and exhaust fumes entering
 * the cabin (Exhaust, item 6).
 */
export const SAFETY_GATE_ITEMS = ["fluids_leaks-7", "exhaust-6"] as const;

/**
 * Whole-car rule 1, as a check: returns the list of triggers
 * when any safety-gated system is graded Safety concern (or a
 * gated item is a safety-concern finding) while the report
 * says the car is safe to drive. The report then needs the
 * inspector's written reason, which joins the owner's summary.
 */
export function safetyGateTriggers(
  findings: InspectionFinding[],
  safeToDrive: boolean,
): string[] {
  if (!safeToDrive) return [];
  const triggers: string[] = [];
  for (const finding of findings) {
    if (
      (SAFETY_GATE_SYSTEMS as readonly string[]).includes(finding.system) &&
      finding.severity === "safety_concern"
    ) {
      triggers.push(
        inspectionSection(finding.system)?.label ?? finding.system,
      );
    }
    for (const result of finding.items ?? []) {
      if (
        (SAFETY_GATE_ITEMS as readonly string[]).includes(result.item) &&
        result.status === "concern" &&
        result.severity === "safety_concern"
      ) {
        triggers.push(inspectionItemLabel(result.item) ?? result.item);
      }
    }
  }
  return triggers;
}

/**
 * Every not-inspected item across a findings set, named for
 * the owner's summary (whole-car rule 4): section label, item
 * text, and the reason in plain words.
 */
export function notInspectedEntries(
  findings: InspectionFinding[],
): Array<{ section: string; item: string; reason: string }> {
  const out: Array<{ section: string; item: string; reason: string }> = [];
  for (const finding of findings) {
    const section = inspectionSection(finding.system);
    for (const result of finding.items ?? []) {
      if (result.status !== "not_inspected") continue;
      const reasonLabel =
        NOT_INSPECTED_REASONS.find((r) => r.value === result.notInspectedReason)
          ?.label ?? "Not inspected";
      out.push({
        section: section?.label ?? finding.system,
        item: inspectionItemLabel(result.item) ?? result.item,
        reason: reasonLabel,
      });
    }
  }
  return out;
}

export const INSPECTION_CHECKLIST: {
  version: string;
  findingShape: {
    system: string;
    severity: InspectionSeverity[];
    note: string;
    items: string;
  };
  systems: InspectionSectionDefinition[];
  sections: InspectionSectionDefinition[];
} = {
  version: INSPECTION_CHECKLIST_VERSION,
  findingShape: {
    system: "one of sections[].key",
    severity: ["ok", "monitor", "needs_attention", "safety_concern"],
    note: "free text, optional when severity is ok",
    items:
      "per-item results for the section's checklist items: each ends checked_ok, concern (with its own severity), or not_inspected (with a reason from the short list); measurements recorded where the item names one",
  },
  systems: INSPECTION_SYSTEMS,
  sections: INSPECTION_SECTIONS,
};

/* =============================================================
 * Section 3 — the vehicle-specific known-issues block.
 *
 * Generated per job, before the visit, for the exact vehicle
 * (year, make, model, engine, VIN where provided): open recalls
 * from NHTSA data and pattern failures from the sourced pattern
 * library, each written as a directed check. The generated
 * checks are stored on the chain's inspection_details row
 * (known_issues) at job-pack build time — desk work, outside
 * this client — and the inspector files one mark per check.
 * ============================================================= */

export type KnownIssueKind = "recall" | "pattern";

/** The three marks a known-issues check can end with. */
export type KnownIssueMark =
  | "evidence_found"
  | "no_evidence_found"
  | "could_not_check";

export const KNOWN_ISSUE_MARKS: Array<{ value: KnownIssueMark; label: string }> = [
  { value: "evidence_found", label: "Evidence found" },
  { value: "no_evidence_found", label: "No evidence found" },
  { value: "could_not_check", label: "Could not check from the driveway" },
];

/**
 * One directed check in the block, in the section 3.2 format.
 * Every check carries its source; nothing without a source
 * enters the block (section 3.4, rule 2).
 */
export interface KnownIssueCheck {
  id: string;
  kind: KnownIssueKind;
  /** The check, stated in plain words. */
  title: string;
  /** What fails / what the recall is about, in plain words. */
  pattern: string;
  /** Where the pattern is documented — travels with the check. */
  source: string;
  /** The specific places the check directs the inspector. */
  whereToLook?: string;
  /** The observable signs that count as evidence. */
  evidenceSigns?: string;
  /** What this visit can and cannot settle, stated honestly. */
  canCannot?: string;
}

/** A check as filed: the check plus the inspector's mark. */
export interface KnownIssueResult extends KnownIssueCheck {
  mark?: KnownIssueMark;
  /** The evidence (for a found mark) or the reason (could not check). */
  evidenceNote?: string;
}

/** Section 3.4, rule 5: an empty block is an honest answer. */
export const KNOWN_ISSUES_EMPTY_STATEMENT =
  "No open recalls found in NHTSA data and no documented pattern failures on file for this vehicle";

/** Section 3.4, rule 4: the block's size is printed, not implied. */
export function knownIssuesHeader(checks: KnownIssueCheck[]): string {
  const recalls = checks.filter((c) => c.kind === "recall").length;
  const patterns = checks.length - recalls;
  return `Vehicle-specific checks for this car: ${checks.length} (${recalls} recalls, ${patterns} pattern checks)`;
}

/** Section 3.4, rule 3 + whole-car rule 11: every item gets a mark. */
export function knownIssuesComplete(
  results: KnownIssueResult[] | null | undefined,
): boolean {
  if (!results) return true;
  return results.every(
    (r) => r.mark != null && (r.evidenceNote ?? "").trim() !== "",
  );
}

/**
 * The draft's four worked examples (section 3.3), carried as
 * FORMAT REFERENCE ONLY — they fix the shape of a pattern
 * check. They are not the pattern library and are never served
 * as a car's block; a car's block is generated per job from
 * sourced patterns for that exact vehicle.
 */
export const KNOWN_ISSUE_FORMAT_EXAMPLES: Array<
  KnownIssueCheck & { vehicle: string }
> = [
  {
    id: "example-glc-water-intrusion",
    kind: "pattern",
    vehicle: "2016–2022 Mercedes-Benz GLC (X253)",
    title: "Water intrusion, rear body",
    pattern:
      "Water enters the rear body through the tail-light seals and rear bumper vents and pools in the rear cargo area, where the amplifier and other rear modules sit. Modules corrode and die; the first symptom the owner notices is often the audio system failing.",
    whereToLook:
      "Spare tire well and rear cargo floor for standing water, tide lines, and corrosion; the amplifier and satellite module connectors for green corrosion and repinning damage; the audio system itself (dead sound is evidence, not a separate mystery); sunroof drains and rear seals as the entry suspects.",
    evidenceSigns:
      "Moisture or staining in the well, corrosion on module connectors, a dead or intermittent amplifier, water trails below the tail lights.",
    canCannot:
      "A driveway visit can confirm this one — the damage and the water are reachable without a lift. What it cannot settle is which exact entry point is leaking; that takes a water test a shop performs.",
    source:
      "Documented in Wrenchli's own case records — a 2016 GLC300 inspected at 134,163 miles with the amplifier and satellite modules destroyed by exactly this intrusion (repair order #94154, October 2026).",
  },
  {
    id: "example-civic-r18-block",
    kind: "pattern",
    vehicle: "2006–2011 Honda Civic, 1.8L (R18) engine",
    title: "Engine block coolant leak",
    pattern:
      "The engine block can crack and leak coolant externally, a failure common enough on this engine that the manufacturer extended warranty coverage for it.",
    whereToLook:
      "The front of the block for coolant staining and crust; the reservoir level against its marks; the ground survey for coolant at the front of the car; the temperature gauge on the road test.",
    evidenceSigns:
      "Dried coolant trails on the block, a low reservoir with no hose leak found, sweet coolant smell at the front of the bay.",
    canCannot:
      "A driveway visit can find the leak's evidence; it cannot see the crack itself in every case, and a car that is full and dry today is \"no evidence found,\" not cleared.",
    source: "Manufacturer service bulletin and warranty extension for this engine.",
  },
  {
    id: "example-gm-afm-oil",
    kind: "pattern",
    vehicle: "2007–2013 GM trucks and SUVs with the 5.3L V8 and cylinder deactivation (AFM)",
    title: "Oil consumption",
    pattern:
      "These engines are documented to consume oil between changes, fouling plugs and eventually causing misfires that owners feel as a rough-running engine.",
    whereToLook:
      "The dipstick before anything is topped up — the level is the evidence; plug condition where a plug can be reached (the misfiring cylinder's plug tells the story); the code scan for misfire codes on specific cylinders.",
    evidenceSigns:
      "Oil measurably low for the miles since the last change, oil-fouled plug, stored or pending misfire codes.",
    canCannot:
      "A driveway visit can establish that oil is being consumed and that plugs are fouling; it cannot measure the consumption rate — that takes miles and a second reading, and the report says so.",
    source: "Manufacturer service bulletins on oil consumption for this engine family.",
  },
  {
    id: "example-subaru-ej25-gaskets",
    kind: "pattern",
    vehicle: "Subaru vehicles with the EJ25 2.5L engine (many 1998–2011 models)",
    title: "External head gasket leaks",
    pattern:
      "The head gaskets on this engine are documented to weep oil and coolant externally as the cars age, long before they fail outright.",
    whereToLook:
      "The head-to-block seams on both sides, reachable from above and from ground level; the ground survey for matched oil and coolant at the sides of the engine; the coolant reservoir for level and condition.",
    evidenceSigns:
      "Wet or crusted seepage along the head seam (wet and fresh outranks dry grime, per the Fluids and leaks rules), two fluids low together.",
    canCannot:
      "External weeping is visible from a driveway; internal gasket failure (exhaust gas in the coolant) needs a shop test the visit does not include, and the check says so.",
    source: "Extensively documented in technical press and manufacturer bulletins for this engine.",
  },
];

/* =============================================================
 * Section 6 — the pre-assessment comparison block.
 *
 * The block is SEALED while the inspector works the general
 * checklist and the known-issues block: the token RPC serves
 * `pre_assessment` only after the findings are filed (see the
 * 20261114130000 migration), and serves it WITHOUT likelihood
 * figures. Verdicts are filed with the report; the server then
 * attaches each cause's likelihood as issued to the stored
 * record, which is what makes the trust record (suspected vs
 * found vs shop-confirmed) line up honestly later.
 * ============================================================= */

/** A suspected cause as the sealed block serves it: name + id only. */
export interface SuspectedCause {
  /** Stable identifier, carried through every later record unchanged. */
  id: string;
  /** The cause's plain name. */
  name: string;
}

/** A suspected cause with its likelihood, as issued. */
export interface SuspectedCauseWithLikelihood extends SuspectedCause {
  likelihood?: number;
}

/** The three verdicts an inspector can file per suspected cause. */
export type ComparisonVerdict = "confirmed" | "not_found" | "could_not_check";

export const COMPARISON_VERDICTS: Array<{
  value: ComparisonVerdict;
  label: string;
}> = [
  { value: "confirmed", label: "Confirmed" },
  { value: "not_found", label: "Not found" },
  { value: "could_not_check", label: "Could not check from the driveway" },
];

/**
 * One filed verdict (section 6.2): the verdict, the evidence
 * note, and the checklist system or known-issues item the
 * verdict rests on. `likelihood` is attached by the SERVER
 * from the pre-assessment as issued, after verdicts are filed
 * — it is never part of what the inspector submits.
 */
export interface ComparisonVerdictEntry {
  causeId: string;
  name: string;
  verdict: ComparisonVerdict;
  evidenceNote: string;
  /** Checklist section key or known-issues check id the verdict rests on. */
  basis?: string;
  /** Attached server-side post-filing; absent in submitted verdicts. */
  likelihood?: number;
}

/**
 * Derive the suspected-cause snapshot from a package's
 * diagnosis_details, the record the pre-assessment leaves on
 * the referral package. The wizard's assessment names its
 * causes in `possible_causes` (name + probability); a cause
 * keeps its own `id` when the assessment issued one, and
 * otherwise takes its position ("cause-1", "cause-2", …) as
 * the identifier carried through. Mirrors the server-side
 * derivation in get_referral_package_by_token /
 * submit_inspection_report exactly — the two must agree, and
 * the migration replay tests pin the server side.
 */
export function suspectedCausesFromDiagnosisDetails(
  details: unknown,
): SuspectedCauseWithLikelihood[] {
  if (!details || typeof details !== "object") return [];
  const raw = (details as Record<string, unknown>).possible_causes;
  if (!Array.isArray(raw)) return [];
  const causes: SuspectedCauseWithLikelihood[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const e = entry as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim() : "";
    if (!name) return;
    const cause: SuspectedCauseWithLikelihood = {
      id: typeof e.id === "string" && e.id.trim() !== "" ? e.id : `cause-${index + 1}`,
      name,
    };
    const likelihood =
      typeof e.probability === "number"
        ? e.probability
        : typeof e.likelihood === "number"
          ? e.likelihood
          : undefined;
    if (likelihood != null && Number.isFinite(likelihood)) {
      cause.likelihood = likelihood;
    }
    causes.push(cause);
  });
  return causes;
}

/** Strip likelihoods: the shape the sealed block may serve. */
export function sealSuspectedCauses(
  causes: SuspectedCauseWithLikelihood[],
): SuspectedCause[] {
  return causes.map((c) => ({ id: c.id, name: c.name }));
}

/**
 * Section 7 — honest limits, in the words the report uses.
 * This belongs in every filed report.
 */
export const INSPECTION_LIMITS_INTRO =
  "This inspection was done where your car sits, on the ground, with no lift and no parts taken off. That sets real limits, and you should know them:";

export const INSPECTION_LIMITS: string[] = [
  "The underside is mostly unseen. We can see the edges and what hangs low, but not the full frame, the whole exhaust, the full length of the fuel and brake lines, or suspension joints under load. Anything under there is reported as not inspected, not as fine.",
  "We cannot see inside the engine or the transmission. Internal wear shows itself only through fluid condition, sounds, computer codes, and how the car drives. A car can pass all of that and still have wear we cannot detect this way.",
  "Brakes are measured only where they can be seen. Without taking wheels off, some pads cannot be measured, and rear drum brake linings cannot be seen at all. Those are listed as not inspected — never guessed.",
  "Covers hide things. Many cars have plastic trays under the engine that hide leaks and parts. What sits behind a cover we could not remove is not inspected.",
  "The computer scan reads what the car reports. It cannot prove a part will not fail tomorrow, and if codes were cleared before the visit, some faults will not show again until the car has been driven more. The report tells you when the monitors suggest that.",
  "If the road test did not happen, driving behavior was not verified. The report says why, and the safe-to-drive answer rests on the standing-still checks only.",
  "The known-issues checks are directed looks, not verdicts on the pattern. For each known problem of your car's model, the inspector looked where that problem shows itself. Finding no evidence means the problem's signs were not there to be seen on this visit — it does not guarantee the problem is absent, and a pattern that develops later will not have been \"missed,\" it will not have been there to find yet. Equally, signs that match a known pattern make that pattern the leading suspect, not a proven diagnosis; the shop's work confirms it.",
  "Recall information comes from public records and can lag. A recall shown as open may already have been repaired outside the dealer network, and a brand-new recall may not appear in the data yet. The report says \"appears open in the public data\" unless the VIN record settles it.",
  "The pre-assessment comparison is a record, not a grade on your car. It lines up what was suspected before the visit with what the visit found. A suspected cause marked \"not found\" was not found by this visit's methods — the limits above apply to it like everything else.",
  "This is not a warranty, a safety certification, or a state inspection. It is a professional record of the car's condition on the day, from what could be reached where the car sits. Accident, flood, and repair checks are visual signs, not a vehicle history report.",
];

export const ONSITE_ELIGIBLE_RULE =
  "A job is onsite-eligible only if all three are true where the car sits: (1) no lift, no jack stands, no raising the vehicle — all work is done with the car on the ground, from above or from the side; (2) consumable-class work — the job replaces a wear item or a top-off item with hand tools, no machining, pressing, refrigerant, or welding; (3) no fluid capture beyond a drain pan. If a job fails any one of the three on site, it stops being an onsite job and converts to a repair referral.";

export interface OnsiteEligibleJob {
  key: string;
  label: string;
  note: string;
}

export const ONSITE_ELIGIBLE_JOBS: OnsiteEligibleJob[] = [
  {
    key: "battery_replacement_12v",
    label: "12-volt battery replacement",
    note: "Where the battery is under the hood or otherwise reachable without removing seats or trim panels that require shop tools.",
  },
  {
    key: "battery_terminal_service",
    label: "Battery terminal cleaning and cable-end replacement",
    note: "Hand tools, no fluids, done from above.",
  },
  {
    key: "engine_air_filter",
    label: "Engine air filter replacement",
    note: "Consumable, usually tool-free or basic hand tools, from above.",
  },
  {
    key: "cabin_air_filter",
    label: "Cabin air filter replacement",
    note: "Interior access, no disassembly beyond a glove box or trim panel designed to open by hand.",
  },
  {
    key: "wiper_blades",
    label: "Wiper blade and wiper insert replacement",
    note: "Consumable, tool-free on most vehicles.",
  },
  {
    key: "exterior_bulb",
    label: "Exterior light bulb replacement",
    note: "Headlight, tail, brake, or turn signal, where the housing opens from the engine bay or trunk without removing the bumper or a wheel liner. If the housing needs the wheel or liner off, it converts.",
  },
  {
    key: "fluid_top_offs",
    label: "Fluid top-offs",
    note: "Engine coolant (to the reservoir only, engine cold), windshield washer fluid, power steering fluid where the vehicle has a reservoir. Top-off from a sealed container, nothing drained, nothing opened under pressure.",
  },
  {
    key: "serpentine_belt",
    label: "Serpentine (drive) belt replacement",
    note: "Where the belt route is fully reachable from above with a tensioner tool. If the route runs under the car, it converts.",
  },
  {
    key: "spark_plugs",
    label: "Spark plug replacement",
    note: "On engines where every plug is reachable from above without removing the intake manifold or raising the vehicle. Manifold-off engines convert.",
  },
  {
    key: "gas_struts",
    label: "Gas strut replacement",
    note: "Hood or liftgate support struts, both sides as a pair.",
  },
  {
    key: "key_fob_battery",
    label: "Key fob battery replacement and fob re-sync",
    note: "Where the owner's manual documents the procedure.",
  },
  {
    key: "tire_pressure_tpms_check",
    label: "Tire pressure set and TPMS visual check",
    note: "Adjust pressures to the door placard, inspect for visible damage. Any tire defect found is reported, not repaired on site.",
  },
];

export function onsiteEligibleJobLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return ONSITE_ELIGIBLE_JOBS.find((j) => j.key === key)?.label ?? key;
}

/**
 * The pre-send disclosure for the bounded privacy exception,
 * shown on the inspection send screen before the owner can send
 * (Brief 2 privacy decision, 2026-11-13). Plain words, exact
 * scope: the three items, the accept gate, and email never.
 */
export const INSPECTION_PRIVACY_DISCLOSURE =
  "When the inspector you choose accepts, they will see your first name, your phone number, and the car's location, so they can come to the car and reach you when they arrive. Nobody sees any of that before an inspector accepts. Your email is never shared.";
