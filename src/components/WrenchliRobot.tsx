import { motion } from "framer-motion";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

interface WrenchliRobotProps {
  size?: number;
  waving?: boolean;
}

export default function WrenchliRobot({ size = 1, waving = false }: WrenchliRobotProps) {
  const w = 80 * size;
  const h = 140 * size;

  return (
    <motion.svg
      width={w}
      height={h}
      viewBox="0 0 80 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{
        scale: 1.05,
        filter: "drop-shadow(0 0 8px #14b8a6)",
      }}
    >
      <defs>
        <filter id="tealGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#14b8a6" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Head */}
      <rect x="10" y="2" width="60" height="50" rx="8" fill="#E5E7EB" />
      {/* Eyes */}
      <circle cx="28" cy="22" r="4" fill="#14b8a6" />
      <circle cx="52" cy="22" r="4" fill="#14b8a6" />
      {/* Eye shine */}
      <circle cx="30" cy="20" r="1.5" fill="white" opacity="0.8" />
      <circle cx="54" cy="20" r="1.5" fill="white" opacity="0.8" />
      {/* Smile */}
      <path d="M30 36 Q40 44 50 36" stroke="#1e40af" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Antenna */}
      <line x1="40" y1="2" x2="40" y2="-6" stroke="#E5E7EB" strokeWidth="2" />
      <circle cx="40" cy="-8" r="3" fill="#14b8a6" />

      {/* Body */}
      <rect x="10" y="55" width="60" height="55" rx="6" fill="white" stroke="#1e40af" strokeWidth="2" />
      {/* Logo on chest */}
      <image
        href={wrenchliLogo}
        x="20"
        y="62"
        width="40"
        height="40"
        clipPath="inset(0 round 4px)"
        filter="url(#tealGlow)"
      />

      {/* Left arm (waving) */}
      <motion.rect
        x="2"
        y="58"
        width="4"
        height="30"
        rx="2"
        fill="#E5E7EB"
        animate={{ rotate: [0, -20, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8 }}
        style={{ transformOrigin: "top center" }}
      />

      {/* Right arm */}
      <rect x="74" y="58" width="4" height="30" rx="2" fill="#E5E7EB" />

      {/* Legs */}
      <rect x="22" y="112" width="8" height="20" rx="0" ry="0" fill="#1e40af" style={{ borderRadius: "0 0 4px 4px" }} />
      <rect x="50" y="112" width="8" height="20" rx="0" ry="0" fill="#1e40af" />
      {/* Leg bottom rounds via separate rects */}
      <rect x="22" y="128" width="8" height="4" rx="4" fill="#1e40af" />
      <rect x="50" y="128" width="8" height="4" rx="4" fill="#1e40af" />
    </motion.svg>
  );
}
