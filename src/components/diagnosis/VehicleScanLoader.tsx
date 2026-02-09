import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VehicleSilhouette, { DEFAULT_COLOR, type BodyType } from "@/components/vehicle/VehicleSilhouette";
import EkgLoader from "./EkgLoader";

interface Props {
  vehicleName?: string;
  bodyType?: BodyType | string;
  color?: string;
  codes?: string;
}

const MESSAGES = [
  "Analyzing your vehicle...",
  "Checking common causes...",
  "Reviewing technical bulletins...",
  "Preparing your results...",
];

/**
 * Enhanced loading animation:
 * - If vehicle info available: shows silhouette with scanning effect
 * - Otherwise: falls back to EKG loader
 */
export default function VehicleScanLoader({ vehicleName, bodyType, color, codes }: Props) {
  const [messageIdx, setMessageIdx] = useState(0);
  const hasVehicle = !!bodyType;

  useEffect(() => {
    const messages = codes
      ? [`Looking up ${codes}...`, ...MESSAGES.slice(1)]
      : vehicleName
      ? [`Analyzing your ${vehicleName}...`, ...MESSAGES.slice(1)]
      : MESSAGES;

    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [codes, vehicleName]);

  const displayMessages = codes
    ? [`Looking up ${codes}...`, ...MESSAGES.slice(1)]
    : vehicleName
    ? [`Analyzing your ${vehicleName}...`, ...MESSAGES.slice(1)]
    : MESSAGES;

  if (!hasVehicle) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <EkgLoader />
        <motion.p
          key={messageIdx}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-foreground"
        >
          {displayMessages[messageIdx]}
        </motion.p>
        <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <VehicleSilhouette
          bodyType={bodyType}
          color={color || DEFAULT_COLOR.hex}
          className="w-40 h-20 md:w-48 md:h-24"
          scanning
        />
      </div>
      <motion.p
        key={messageIdx}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-foreground"
      >
        {displayMessages[messageIdx]}
      </motion.p>
      <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
    </div>
  );
}
