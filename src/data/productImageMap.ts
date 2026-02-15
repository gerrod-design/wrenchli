/**
 * Central map of product images generated for the parts catalog.
 * Keys match product IDs in adRecommendations.ts.
 * Images that apply to multiple products in a category share the same import.
 */

import brakePads from "@/assets/parts/brake-pads.jpg";
import sparkPlugs from "@/assets/parts/spark-plugs.jpg";
import coolant from "@/assets/parts/coolant.jpg";
import carBattery from "@/assets/parts/car-battery.jpg";
import motorOil from "@/assets/parts/motor-oil.jpg";
import cabinFilter from "@/assets/parts/cabin-filter.jpg";
import tireRepair from "@/assets/parts/tire-repair.jpg";
import transFluid from "@/assets/parts/trans-fluid.jpg";
import mafCleaner from "@/assets/parts/maf-cleaner.jpg";
import o2Sensor from "@/assets/parts/o2-sensor.jpg";
import gasCap from "@/assets/parts/gas-cap.jpg";
import serpentineBelt from "@/assets/parts/serpentine-belt.jpg";
import toolSet from "@/assets/parts/tool-set.jpg";
import obd2Scanner from "@/assets/parts/obd2-scanner.jpg";

/** Maps product IDs → local image imports */
const productImageMap: Record<string, string> = {
  // Brakes
  "brake-pads-bosch": brakePads,
  "brake-caliper-tool": toolSet,
  "brake-cleaner": mafCleaner, // spray can

  // Engine misfire
  "spark-plugs-ngk": sparkPlugs,
  "ignition-coil-delphi": sparkPlugs,
  "spark-plug-socket": toolSet,

  // Cooling
  "thermostat-stant": coolant,
  "coolant-zerex": coolant,
  "coolant-funnel": toolSet,

  // Battery / electrical
  "battery-terminal-cleaner": carBattery,
  "battery-tester": carBattery,
  "jump-starter": carBattery,

  // Oil change
  "oil-mobil1": motorOil,
  "oil-filter-fram": motorOil,
  "oil-drain-pan": toolSet,

  // HVAC
  "cabin-filter-epauto": cabinFilter,
  "ac-recharge-acpro": cabinFilter,
  "ac-leak-detector": toolSet,

  // Tire
  "tire-plug-kit": tireRepair,
  "tire-inflator": tireRepair,
  "tire-gauge": tireRepair,

  // Transmission
  "trans-fluid-valvoline": transFluid,
  "trans-funnel": toolSet,
  "obd2-scanner": obd2Scanner,

  // Fuel system
  "maf-cleaner-crc": mafCleaner,
  "fuel-injector-cleaner": mafCleaner,
  "vacuum-hose-kit": toolSet,

  // Emissions
  "o2-sensor-denso": o2Sensor,
  "o2-sensor-socket": toolSet,
  "penetrating-oil-pb": mafCleaner,

  // EVAP
  "gas-cap-stant": gasCap,
  "smoke-machine": toolSet,
  "obd2-basic": obd2Scanner,

  // Noise
  "serpentine-belt-gates": serpentineBelt,
  "mechanics-stethoscope": toolSet,
  "belt-tensioner": serpentineBelt,

  // General
  "obd2-foxwell": obd2Scanner,
  "tool-set-dewalt": toolSet,
  "creeper": toolSet,
};

export default productImageMap;
