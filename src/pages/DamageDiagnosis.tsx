import { useState } from "react";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, ScanSearch, ShieldCheck } from "lucide-react";
import PhotoUploader from "@/components/damage/PhotoUploader";
import DamageAnalysisResult, { type DamageDiagnosis } from "@/components/damage/DamageAnalysisResult";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DamageDiagnosisPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DamageDiagnosis | null>(null);

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      toast.error("Please upload at least one photo of the damage.");
      return;
    }

    setAnalyzing(true);
    setDiagnosis(null);

    try {
      const { data, error } = await supabase.functions.invoke("diagnose-damage-photo", {
        body: {
          image_urls: photos,
          vehicle_info: vehicleInfo || undefined,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setDiagnosis(data.diagnosis);
      toast.success("Damage analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze photos. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPhotos([]);
    setDiagnosis(null);
    setVehicleInfo("");
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Photo Damage Diagnosis — Wrenchli"
        description="Upload photos of your vehicle damage and get instant AI-powered diagnosis with repair options and cost estimates."
        path="/damage-diagnosis"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container-wrenchli">
          <SectionReveal>
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Camera className="h-4 w-4" />
                AI-Powered Analysis
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
                Photo Damage Diagnosis
              </h1>
              <p className="text-lg text-primary-foreground/80">
                Snap a photo of your vehicle damage and our AI will identify the issue, assess severity, and suggest repair options with estimated costs.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Main content */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-2xl">
          {!diagnosis ? (
            <SectionReveal>
              <div className="space-y-6">
                {/* Vehicle info (optional) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Vehicle (optional — improves accuracy)
                  </label>
                  <Input
                    placeholder="e.g. 2022 Jeep Grand Cherokee"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    className="h-12"
                    disabled={analyzing}
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Damage Photos
                  </label>
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={setPhotos}
                    maxPhotos={5}
                    disabled={analyzing}
                  />
                </div>

                {/* Analyze button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || photos.length === 0}
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold h-14 text-base"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Damage...
                    </>
                  ) : (
                    <>
                      <ScanSearch className="mr-2 h-5 w-5" />
                      Analyze Damage
                    </>
                  )}
                </Button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    AI-powered analysis
                  </span>
                  <span>•</span>
                  <span>Free to use</span>
                  <span>•</span>
                  <span>No account required</span>
                </div>
              </div>
            </SectionReveal>
          ) : (
            <SectionReveal>
              <div className="space-y-6">
                {/* Uploaded photos preview */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((url, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-border">
                      <img src={url} alt={`Damage ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {vehicleInfo && (
                  <p className="text-sm text-muted-foreground">Vehicle: {vehicleInfo}</p>
                )}

                <DamageAnalysisResult
                  diagnosis={diagnosis}
                  imageUrls={photos}
                  vehicleInfo={vehicleInfo}
                />

                <Button variant="outline" onClick={handleReset} className="w-full">
                  Analyze Another Issue
                </Button>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> AI damage analysis is for informational purposes only and should not replace a professional in-person inspection. Cost estimates are approximate and may vary by location and shop. Always consult a qualified mechanic for safety-related damage.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
