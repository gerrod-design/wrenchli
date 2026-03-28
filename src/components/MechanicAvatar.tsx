import mechanicImg from "@/assets/mechanic-advisor.png";
import agentSamImg from "@/assets/agent-sam.png";
import agentJessImg from "@/assets/agent-jess.png";
import agentKaiImg from "@/assets/agent-kai.png";
import agentPriyaImg from "@/assets/agent-priya.png";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

export type AgentType = "mike" | "sam" | "jess" | "kai" | "priya";

const AGENTS: Record<AgentType, { img: string; label: string }> = {
  mike:  { img: mechanicImg,   label: "Mike — Lead Advisor" },
  sam:   { img: agentSamImg,   label: "Sam — Cost Specialist" },
  jess:  { img: agentJessImg,  label: "Jess — Parts & DIY Expert" },
  kai:   { img: agentKaiImg,   label: "Kai — Finance Specialist" },
  priya: { img: agentPriyaImg, label: "Priya — Prevention Coach" },
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
  agent = "mike",
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
      {showLogo && size >= 36 && (
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
