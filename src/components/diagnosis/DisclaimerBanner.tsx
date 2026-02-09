import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div
      className="rounded-lg border-l-4 p-4 md:p-5 mb-6"
      style={{
        backgroundColor: "hsl(45 100% 97%)",
        borderLeftColor: "hsl(38 92% 50%)",
      }}
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "hsl(38 92% 50%)" }} />
        <div className="text-sm leading-relaxed text-foreground">
          <span className="font-bold">Important Disclaimer:</span> The information below is for general guidance only and is based on common diagnoses associated with the symptoms or diagnostic codes you provided. This is not a professional diagnosis. Your vehicle must be inspected by a qualified automotive technician before any repair work is performed. Actual causes, conditions, required repairs, and costs may vary significantly based on your vehicle's specific condition, mileage, maintenance history, and other factors. Wrenchli does not guarantee the accuracy of these estimates and is not liable for any decisions made based on this information.
        </div>
      </div>
    </div>
  );
}
