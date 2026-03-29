import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, Loader2, Pencil, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface KnownIssue {
  id: string;
  make: string;
  model: string | null;
  year_start: number | null;
  year_end: number | null;
  description: string;
  mileage_min: number | null;
  mileage_max: number | null;
  severity: string;
  estimated_cost: string | null;
  category: string | null;
  source: string;
  source_url: string | null;
  confidence_score: number;
  status: string;
  complaint_count: number | null;
  tags: string[];
  created_at: string;
}

const SEVERITY_OPTIONS = ["low", "medium", "high"];
const STATUS_OPTIONS = ["draft", "pending_review", "approved", "rejected"];
const SOURCE_OPTIONS = ["manual", "nhtsa_complaints", "ai_generated", "tsb"];
const CATEGORY_OPTIONS = [
  "engine", "transmission", "cooling", "electrical", "suspension", "brakes",
  "steering", "exhaust", "fuel", "body", "interior", "HVAC", "drivetrain",
  "battery", "safety systems", "chassis",
];

const emptyForm = {
  make: "", model: "", year_start: "", year_end: "", description: "",
  mileage_min: "", mileage_max: "", severity: "medium", estimated_cost: "",
  category: "", source: "manual", source_url: "", confidence_score: "100",
  status: "approved", tags: "",
};

export default function KnownIssuesManager() {
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueMakes, setUniqueMakes] = useState<string[]>([]);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vehicle_known_issues" as any)
        .select("*")
        .order("make", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(500);

      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterSeverity !== "all") query = query.eq("severity", filterSeverity);
      if (filterMake) query = query.ilike("make", `%${filterMake}%`);
      if (search) query = query.ilike("description", `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      setIssues((data as any[]) || []);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
      toast.error("Failed to load known issues");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity, filterMake, search]);

  const fetchStats = useCallback(async () => {
    const { count } = await supabase
      .from("vehicle_known_issues" as any)
      .select("*", { count: "exact", head: true });
    setTotalCount(count || 0);

    const { data: makes } = await supabase
      .from("vehicle_known_issues" as any)
      .select("make")
      .order("make");
    if (makes) {
      const unique = [...new Set((makes as any[]).map((m: any) => m.make))];
      setUniqueMakes(unique as string[]);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openEdit = (issue: KnownIssue) => {
    setEditingId(issue.id);
    setForm({
      make: issue.make,
      model: issue.model || "",
      year_start: issue.year_start?.toString() || "",
      year_end: issue.year_end?.toString() || "",
      description: issue.description,
      mileage_min: issue.mileage_min?.toString() || "",
      mileage_max: issue.mileage_max?.toString() || "",
      severity: issue.severity,
      estimated_cost: issue.estimated_cost || "",
      category: issue.category || "",
      source: issue.source,
      source_url: issue.source_url || "",
      confidence_score: issue.confidence_score.toString(),
      status: issue.status,
      tags: (issue.tags || []).join(", "),
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.description) {
      toast.error("Make and description are required");
      return;
    }
    setSaving(true);
    const payload = {
      make: form.make.trim(),
      model: form.model.trim() || null,
      year_start: form.year_start ? parseInt(form.year_start) : null,
      year_end: form.year_end ? parseInt(form.year_end) : null,
      description: form.description.trim(),
      mileage_min: form.mileage_min ? parseInt(form.mileage_min) : null,
      mileage_max: form.mileage_max ? parseInt(form.mileage_max) : null,
      severity: form.severity,
      estimated_cost: form.estimated_cost.trim() || null,
      category: form.category || null,
      source: form.source,
      source_url: form.source_url.trim() || null,
      confidence_score: parseInt(form.confidence_score) || 100,
      status: form.status,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("vehicle_known_issues" as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Issue updated");
      } else {
        const { error } = await supabase
          .from("vehicle_known_issues" as any)
          .insert(payload);
        if (error) throw error;
        toast.success("Issue created");
      }
      setDialogOpen(false);
      fetchIssues();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this known issue?")) return;
    const { error } = await supabase
      .from("vehicle_known_issues" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      fetchIssues();
      fetchStats();
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-3.5 w-3.5 text-wrenchli-teal" />;
    if (status === "rejected") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-wrenchli-amber" />;
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{totalCount} total issues</Badge>
        <Badge variant="outline">{uniqueMakes.length} brands</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Input
          placeholder="Filter by make…"
          value={filterMake}
          onChange={(e) => setFilterMake(e.target.value)}
          className="w-36 h-9 text-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sev.</SelectItem>
            {SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Issue</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Known Issue</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Make *</Label>
                  <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Model</Label>
                  <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="All models" className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Year Start</Label>
                  <Input type="number" value={form.year_start} onChange={(e) => setForm({ ...form, year_start: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Year End</Label>
                  <Input type="number" value={form.year_end} onChange={(e) => setForm({ ...form, year_end: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-sm min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Mileage Min</Label>
                  <Input type="number" value={form.mileage_min} onChange={(e) => setForm({ ...form, mileage_min: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Mileage Max</Label>
                  <Input type="number" value={form.mileage_max} onChange={(e) => setForm({ ...form, mileage_max: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Estimated Repair Cost</Label>
                <Input value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="$400–800" className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Confidence (0-100)</Label>
                  <Input type="number" value={form.confidence_score} onChange={(e) => setForm({ ...form, confidence_score: e.target.value })} className="h-8 text-sm" min={0} max={100} />
                </div>
                <div>
                  <Label className="text-xs">NHTSA Complaint Count</Label>
                  <Input type="number" className="h-8 text-sm" disabled placeholder="Future use" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Source URL</Label>
                <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="recall, safety, common" className="h-8 text-sm" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update" : "Create"} Issue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-2 font-medium">Make</th>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 font-medium">Severity</th>
                <th className="text-left p-2 font-medium">Miles</th>
                <th className="text-left p-2 font-medium">Cost</th>
                <th className="text-left p-2 font-medium">Source</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Conf.</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 font-medium whitespace-nowrap">{issue.make}</td>
                  <td className="p-2 max-w-[250px] truncate">{issue.description}</td>
                  <td className="p-2">
                    <Badge variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "default" : "secondary"} className="text-[10px]">
                      {issue.severity}
                    </Badge>
                  </td>
                  <td className="p-2 whitespace-nowrap text-muted-foreground">
                    {issue.mileage_min && issue.mileage_max
                      ? `${(issue.mileage_min / 1000).toFixed(0)}k–${(issue.mileage_max / 1000).toFixed(0)}k`
                      : "—"}
                  </td>
                  <td className="p-2 whitespace-nowrap text-muted-foreground">{issue.estimated_cost || "—"}</td>
                  <td className="p-2 capitalize text-muted-foreground">{issue.source.replace("_", " ")}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      {statusIcon(issue.status)}
                      <span className="capitalize">{issue.status.replace("_", " ")}</span>
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground">{issue.confidence_score}%</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(issue)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(issue.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {issues.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No issues found matching filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
