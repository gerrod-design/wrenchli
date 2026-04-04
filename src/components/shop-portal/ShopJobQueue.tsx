import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, Car, DollarSign, CheckCircle, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShopJobQueueProps {
  shopId: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-500", bg: "bg-amber-500/10" },
  in_progress: { label: "In Progress", color: "text-blue-500", bg: "bg-blue-500/10" },
  completed: { label: "Completed", color: "text-accent", bg: "bg-accent/10" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bg: "bg-muted/50" },
};

export default function ShopJobQueue({ shopId }: ShopJobQueueProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [shopId]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("shop_jobs")
      .select("*, diagnosis_records(primary_diagnosis, symptoms, vehicle_year, vehicle_make, vehicle_model, primary_confidence, tracking_number)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (data) setJobs(data);
    setIsLoading(false);
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "in_progress") updates.started_at = new Date().toISOString();
    if (newStatus === "completed") updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("shop_jobs")
      .update(updates)
      .eq("id", jobId);

    if (error) {
      toast.error("Failed to update job status");
    } else {
      toast.success(`Job marked as ${newStatus.replace("_", " ")}`);
      fetchJobs();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-foreground mb-1">No Jobs Yet</h3>
        <p className="text-sm text-muted-foreground">
          Jobs will appear here when customers book with your shop through Wrenchli.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Job Queue</h2>
        <span className="text-sm text-muted-foreground">
          {jobs.filter(j => j.status === "pending" || j.status === "in_progress").length} active
        </span>
      </div>

      {jobs.map((job) => {
        const diag = job.diagnosis_records;
        const status = statusConfig[job.status] || statusConfig.pending;
        const vehicleStr = [diag?.vehicle_year, diag?.vehicle_make, diag?.vehicle_model].filter(Boolean).join(" ");

        return (
          <div key={job.id} className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.bg, status.color)}>
                    {status.label}
                  </span>
                  {diag?.tracking_number && (
                    <span className="text-xs text-muted-foreground font-mono">{diag.tracking_number}</span>
                  )}
                </div>
                <h3 className="font-bold text-foreground">{diag?.primary_diagnosis || "Unknown"}</h3>
                <p className="text-sm text-muted-foreground">{diag?.symptoms?.slice(0, 100)}</p>
              </div>
              {diag?.primary_confidence && (
                <div className="text-right">
                  <div className="text-lg font-bold text-accent">{diag.primary_confidence}%</div>
                  <span className="text-[10px] text-muted-foreground">AI confidence</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {job.customer_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {job.customer_name}
                </div>
              )}
              {vehicleStr && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Car className="h-3.5 w-3.5" />
                  {vehicleStr}
                </div>
              )}
              {job.estimated_cost && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  ${Number(job.estimated_cost).toLocaleString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {job.status === "pending" && (
                <Button size="sm" onClick={() => updateJobStatus(job.id, "in_progress")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Start Job
                </Button>
              )}
              {job.status === "in_progress" && (
                <Button size="sm" onClick={() => updateJobStatus(job.id, "completed")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
