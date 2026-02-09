import { useIsMobile } from "@/hooks/use-mobile";
import { ReactNode } from "react";

interface DeviceFrameProps {
  children: ReactNode;
}

export default function DeviceFrame({ children }: DeviceFrameProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-[260px] rounded-[32px] border-[3px] border-foreground/20 bg-foreground/5 p-2.5 shadow-xl sm:w-[280px]">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/20" aria-hidden="true" />
          {/* Screen */}
          <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[20px] bg-background">
            {children}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-1 rounded-full bg-foreground/20" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className="w-full max-w-[640px] rounded-xl overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)" }}
      >
        {/* Browser chrome */}
        <div className="flex items-center px-4 py-2.5 relative" style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ddd" }}>
          <div className="flex gap-1.5">
            <span className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#FF5F57" }} />
            <span className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
            <span className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#28C840" }} />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bg-white rounded-md px-4 py-1 text-[13px] text-center min-w-[200px]" style={{ color: "#888", fontFamily: "'Inter', sans-serif" }}>
            🔒 wrenchli.net
          </div>
          <div className="ml-auto flex gap-2 text-[10px]" style={{ color: "#bbb" }}>
            <span>—</span>
            <span>□</span>
            <span>✕</span>
          </div>
        </div>
        {/* Content */}
        <div className="relative aspect-[16/10] bg-background overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}


