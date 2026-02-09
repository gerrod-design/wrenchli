import { Link } from "react-router-dom";

export default function VinPrivacyNotice() {
  return (
    <p className="text-xs text-muted-foreground/70 leading-relaxed">
      Your VIN is used only to identify your vehicle's specifications for accurate diagnosis and parts lookup. 
      Wrenchli does not store VINs beyond your current session unless you create an account and choose to save 
      your vehicle. We do not share VIN data with third parties.{" "}
      <Link to="/privacy" className="text-wrenchli-teal hover:underline font-medium">
        Privacy Policy →
      </Link>
    </p>
  );
}
