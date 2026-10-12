import aidenImg from "@/assets/agent-aiden.webp";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

// One continuous assistant: Aiden. Persona types retired Oct 12, 2026 —
// the chat no longer switches identities, so there is a single agent.
export type AgentType = "aiden";

const AGENTS: Record<AgentType, { img: string; label: string }> = {
  aiden: { img: aidenImg, label: "Aiden from Wrenchli" },
};

interface MechanicAvatarProps {
  size?: number;
  showLogo?: boolean;
  className?: string;
  agent?: AgentType;
}

export default function MechanicAvatar({
  size = 48,
  showLogo = true,
  className = "",
  agent = "aiden",
}: MechanicAvatarProps) {
  const { img, label } = AGENTS[agent];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-accent/10 overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={label}
    >
      <img
        src={img}
        alt={label}
        className="w-full h-full object-cover"
        loading="lazy"
        width={size}
        height={size}
      />
      {showLogo && size >= 28 && (
        <img
          src={wrenchliLogo}
          alt=""
          className="absolute bottom-0 right-0 rounded-full border-2 border-card"
          style={{ width: size * 0.35, height: size * 0.35 }}
          loading="lazy"
        />
      )}
    </div>
  );
}
