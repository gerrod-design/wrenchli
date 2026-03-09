import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type Shop } from "./ShopCard";

interface ScheduleButtonProps {
  shop: Shop;
  variant?: "default" | "outline";
}

export default function ScheduleButton({ shop, variant = "default" }: ScheduleButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    serviceNeeded: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Appointment request sent!", {
      description: `${shop.name} will contact you shortly to confirm.`,
    });
    setLoading(false);
    setOpen(false);
    setFormData({ name: "", email: "", phone: "", preferredDate: "", preferredTime: "", serviceNeeded: "", notes: "" });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Request an appointment with {shop.name}. They'll contact you to confirm availability.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" required value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" required value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" required value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input id="preferredDate" type="date" value={formData.preferredDate} onChange={(e) => handleChange("preferredDate", e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input id="preferredTime" type="time" value={formData.preferredTime} onChange={(e) => handleChange("preferredTime", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceNeeded">Service Needed</Label>
            <Input id="serviceNeeded" value={formData.serviceNeeded} onChange={(e) => handleChange("serviceNeeded", e.target.value)} placeholder="e.g., Oil change, brake repair, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Any specific details or concerns..." rows={3} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>) : "Request Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
