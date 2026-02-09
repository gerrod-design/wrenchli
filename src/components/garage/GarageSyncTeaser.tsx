import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function GarageSyncTeaser() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist_signups").insert({
        email: email.trim(),
        name: "Garage Sync Interest",
      });
      if (error && error.code !== "23505") {
        toast.error("Something went wrong. Try again.");
      } else {
        setSubmitted(true);
        toast.success("You'll be notified when accounts launch!");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-[11px] text-wrenchli-green font-medium">
        ✓ You'll be notified when accounts launch!
      </p>
    );
  }

  if (!showForm) {
    return (
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Want to access your garage on other devices?{" "}
        <button
          onClick={() => setShowForm(true)}
          className="text-wrenchli-teal font-semibold hover:underline"
        >
          Get Notified →
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground font-medium">Get notified when accounts launch</p>
      <div className="flex gap-1.5">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-7 text-xs flex-1"
          maxLength={255}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting}
          className="h-7 text-[10px] px-2 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90"
        >
          <Mail className="h-3 w-3 mr-1" />
          Notify Me
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50">We'll only email you about this. No spam, ever.</p>
    </div>
  );
}
