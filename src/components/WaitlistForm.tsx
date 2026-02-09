import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface WaitlistFormProps {
  userType?: "consumer" | "shop";
  source?: string;
  className?: string;
}

export default function WaitlistForm({ userType = "consumer", source = "home", className = "" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // TODO: Connect to Supabase when Cloud is enabled
    // For now, simulate success
    await new Promise((r) => setTimeout(r, 800));
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you when Wrenchli launches in Detroit.",
    });
    setEmail("");
    setName("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 sm:flex-row sm:items-end ${className}`}>
      <Input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-12 text-base bg-card"
        maxLength={100}
      />
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-12 text-base bg-card"
        maxLength={255}
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 text-base whitespace-nowrap"
      >
        {loading ? "Joining..." : "Join the Waitlist"}
      </Button>
    </form>
  );
}
