import { Link } from "react-router-dom";
import { Car, Plus } from "lucide-react";
import SEO from "@/components/SEO";
import { useGarage } from "@/hooks/useGarage";
import GarageVehicleCard from "@/components/garage/GarageVehicleCard";
import { Button } from "@/components/ui/button";

export default function Garage() {
  const { vehicles, removeVehicle, updateNickname } = useGarage();

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title="My Garage — Saved Vehicles" description="Your saved vehicles for quick access to diagnostics and quotes." path="/garage" />

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <Car className="h-6 w-6 text-wrenchli-teal" />
            <h1 className="font-heading text-2xl font-bold md:text-3xl">My Garage</h1>
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="font-heading text-lg font-semibold">No vehicles saved yet</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Identify a vehicle on the Vehicle Insights page and save it for quick access next time.
              </p>
              <Button asChild className="mt-6 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90">
                <Link to="/vehicle-insights">
                  <Plus className="mr-2 h-4 w-4" /> Add a Vehicle
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <GarageVehicleCard
                  key={v.garageId}
                  vehicle={v}
                  isActive={i === 0}
                  onRemove={removeVehicle}
                  onRename={updateNickname}
                />
              ))}

              {vehicles.length < 5 && (
                <Button asChild variant="outline" className="w-full h-12 border-dashed">
                  <Link to="/vehicle-insights">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Vehicle
                  </Link>
                </Button>
              )}

              <p className="text-center text-[11px] text-muted-foreground mt-6">
                Vehicles saved in this browser. Account sync coming soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
