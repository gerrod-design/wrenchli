import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import SEO from "@/components/SEO";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BaselineFlow } from "@/components/garage/BaselineFlow";
import { useVehicleRecord } from "@/hooks/useVehicleRecord";

export default function VehicleBaseline() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const record = useVehicleRecord(vehicleId);

  if (record.loading) {
    return <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-muted-foreground">Loading the baseline...</main>;
  }

  if (!record.vehicle) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link to="/garage"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Garage</Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Baseline not available</AlertTitle>
          <AlertDescription>{record.error ?? "Sign in and choose a vehicle from your Garage."}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const vehicle = record.vehicle;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:py-8">
      <SEO
        title={`Baseline for ${vehicle.year} ${vehicle.make} ${vehicle.model} | Wrenchli Garage`}
        description="Capture a dated purchase-day baseline with photos, senses checks, and model-specific checks."
        path={`/garage/vehicles/${vehicle.id}/baseline`}
      />
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="px-0">
            <Link to={`/garage/vehicles/${vehicle.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Vehicle record
            </Link>
          </Button>
          <Button variant="outline" onClick={record.exportPdf}>
            <Download className="mr-2 h-4 w-4" /> Export record PDF
          </Button>
        </div>

        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Garage Baseline</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Capture what you can see, hear, smell, and feel today. Anything not captured stays honestly marked as not answered in this run.
          </p>
        </header>

        {record.error && (
          <Alert variant="destructive">
            <AlertTitle>Some baseline data could not be loaded</AlertTitle>
            <AlertDescription>{record.error}</AlertDescription>
          </Alert>
        )}

        <BaselineFlow record={record} />
      </div>
    </main>
  );
}
