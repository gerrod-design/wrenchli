import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  label: string;
  done: boolean;
}

interface ShopGettingStartedProps {
  shopProfile: {
    name?: string;
    address?: string;
    phone?: string;
    logo_url?: string;
  } | null;
  hasIntegration: boolean;
  qrShareCount: number;
  confirmedOutcomes: number;
}

export default function ShopGettingStarted({
  shopProfile,
  hasIntegration,
  qrShareCount,
  confirmedOutcomes,
}: ShopGettingStartedProps) {
  const profileComplete = Boolean(
    shopProfile?.name && shopProfile?.address && shopProfile?.phone
  );
  const hasLogo = Boolean(shopProfile?.logo_url);

  const items: ChecklistItem[] = [
    { label: "Complete your shop profile (name, address, hours, phone)", done: profileComplete },
    { label: "Add your shop logo", done: hasLogo },
    { label: "Connect your SMS integration (Tekmetric, AutoLeap, Mitchell 1, or CSV)", done: hasIntegration },
    { label: "Share your QR code with 5 customers", done: qrShareCount >= 5 },
    { label: "Confirm your first repair outcome", done: confirmedOutcomes >= 1 },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-foreground">Getting Started</h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: allDone ? "#E07B3920" : "#E07B3910",
            color: "#E07B39",
            border: "1px solid #E07B3940",
          }}
        >
          {allDone ? "🏆 Pilot Partner" : "⭐ New Partner"}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        {completedCount} of {items.length} complete
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%`, background: "#E07B39" }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-xs">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#E07B39" }} />
            ) : (
              <Circle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            )}
            <span className={item.done ? "text-foreground line-through opacity-60" : "text-foreground"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {allDone && (
        <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border">
          All steps complete. Your Pilot Partner badge is now visible to consumers in assessment results.
        </p>
      )}
    </div>
  );
}
