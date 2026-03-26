import mechanicImg from "@/assets/mechanic-advisor.png";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

interface MechanicAvatarProps {
  size?: number;       // px – defaults to 48
  showLogo?: boolean;  // overlay the Wrenchli badge
  className?: string;
}

export default function MechanicAvatar({
  size = 48,
  showLogo = true,
  className = "",
}: MechanicAvatarProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-accent/10 overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={mechanicImg}
        alt="Wrenchli advisor"
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
