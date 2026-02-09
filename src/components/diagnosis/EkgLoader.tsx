import { motion } from "framer-motion";

/**
 * Branded EKG / heartbeat-line loader that sweeps left-to-right,
 * mirroring the pulse in the Wrenchli logo.
 */
export default function EkgLoader() {
  // SVG path: flat → sharp spike (EKG peak) → flat
  const ekgPath = "M0,25 L30,25 L38,25 L42,8 L48,42 L54,12 L58,25 L66,25 L100,25";

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 100 50"
        className="w-48 h-12 md:w-56 md:h-14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Faint background line */}
        <path
          d={ekgPath}
          stroke="hsl(var(--wrenchli-teal) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated EKG trace */}
        <motion.path
          d={ekgPath}
          stroke="hsl(var(--wrenchli-teal))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, pathOffset: 0 }}
          animate={{
            pathLength: [0, 0.4, 0.4, 0],
            pathOffset: [0, 0, 0.6, 1],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.3,
          }}
        />

        {/* Glow dot that follows the trace */}
        <motion.circle
          r="3"
          fill="hsl(var(--wrenchli-teal))"
          filter="url(#ekgGlow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.3,
          }}
          style={{
            offsetPath: `path('${ekgPath}')`,
          }}
        />

        {/* Glow filter */}
        <defs>
          <filter id="ekgGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
