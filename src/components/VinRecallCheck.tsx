import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionReveal from "@/components/SectionReveal";
import { isValidVin, sanitizeVin, decodeVin, type DecodedVehicle } from "@/lib/vinDecoder";
import RecallActionCard from "@/components/recall/RecallActionCard";

interface NHTSARecall {
  NHTSACampaignNumber: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
}

type RecallState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; vehicle: DecodedVehicle; recalls: NHTSARecall[] }
  | { status: "clear"; vehicle: DecodedVehicle }
  | { status: "error"; message: string };

async function fetchNHTSARecalls(make: string, model: string, year: string): Promise<NHTSARecall[]> {
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("NHTSA API unavailable");
  const data = await res.json();
  return (data?.results || []).filter((r: NHTSARecall) => r.NHTSACampaignNumber);
}

export default function VinRecallCheck() {
  const [vin, setVin] = useState("");
  const [state, setState] = useState<RecallState>({ status: "idle" });

  const handleCheck = async () => {
    const cleaned = sanitizeVin(vin);
    if (!isValidVin(cleaned)) {
      setState({ status: "error", message: "Enter a valid 17-character VIN." });
      return;
    }

    setState({ status: "loading" });
    try {
      const vehicle = await decodeVin(cleaned);
      if (!vehicle.make || !vehicle.model || !vehicle.year) {
        setState({ status: "error", message: "Could not decode this VIN. Double-check and try again." });
        return;
      }
      const recalls = await fetchNHTSARecalls(vehicle.make, vehicle.model, vehicle.year);
      if (recalls.length > 0) {
        setState({ status: "found", vehicle, recalls });
      } else {
        setState({ status: "clear", vehicle });
      }
    } catch {
      setState({ status: "error", message: "Something went wrong. Please try again." });
    }
  };

  const assessmentLink = state.status === "found" || state.status === "clear"
    ? `/#quote`
    : "/#quote";

  return (
    <section className="section-padding" style={{ backgroundColor: "#0F1117" }}>
      <div className="container-wrenchli max-w-2xl">
        <SectionReveal>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <h2 className="font-heading text-xl font-bold text-white md:text-2xl">
                Check your vehicle for open safety recalls
              </h2>
            </div>
            <p className="text-sm text-white/50 mb-6 ml-[52px]">
              Enter your VIN — free, instant, no account required
            </p>

            {/* Input */}
            {(state.status === "idle" || state.status === "loading" || state.status === "error") && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={vin}
                  onChange={(e) => setVin(sanitizeVin(e.target.value))}
                  placeholder="e.g. 1FTEW1EP5KFA12345"
                  maxLength={17}
                  className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  disabled={state.status === "loading"}
                />
                <Button
                  onClick={handleCheck}
                  disabled={state.status === "loading"}
                  className="h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                >
                  {state.status === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking…</>
                  ) : (
                    "Check Recalls"
                  )}
                </Button>
              </div>
            )}

            {state.status === "error" && (
              <p className="mt-3 text-sm text-red-400">{state.message}</p>
            )}

            {/* Recalls Found */}
            {state.status === "found" && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm font-semibold">
                    {state.vehicle.year} {state.vehicle.make} {state.vehicle.model} confirmed
                  </span>
                </div>

                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold">
                    {state.recalls.length} open recall{state.recalls.length > 1 ? "s" : ""} found
                  </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {state.recalls.map((r) => (
                    <div key={r.NHTSACampaignNumber} className="space-y-2">
                      <div
                        className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-white">{r.Component}</span>
                          <span className="text-xs font-mono text-white/40 shrink-0">
                            {r.NHTSACampaignNumber}
                          </span>
                        </div>
                        {r.Consequence && (
                          <p className="text-sm text-white/70 leading-relaxed">{r.Consequence}</p>
                        )}
                      </div>
                      <RecallActionCard
                        vin={sanitizeVin(vin)}
                        make={state.vehicle.make}
                        campaignNumber={r.NHTSACampaignNumber}
                        component={r.Component}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                    <Link to={assessmentLink}>
                      Run a full symptom assessment for this vehicle
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-white/10 text-white hover:bg-white/5"
                    onClick={() => { setVin(""); setState({ status: "idle" }); }}
                  >
                    Check another VIN
                  </Button>
                </div>
              </div>
            )}

            {/* No Recalls */}
            {state.status === "clear" && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm font-semibold">
                    {state.vehicle.year} {state.vehicle.make} {state.vehicle.model} confirmed
                  </span>
                </div>

                <div className="flex items-center gap-2 text-green-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold">No open recalls found for this vehicle</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                    <Link to={assessmentLink}>
                      Run a full symptom assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-white/10 text-white hover:bg-white/5"
                    onClick={() => { setVin(""); setState({ status: "idle" }); }}
                  >
                    Check another VIN
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
