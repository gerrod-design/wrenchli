import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthGateModal({ open, onClose, onAuthenticated }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const result = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setError("Check your email for a confirmation link, then sign in.");
    } else {
      onAuthenticated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-sm border-0"
        style={{ backgroundColor: "#0F1117", color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: "#F5F5F5" }}>
            <Crown className="h-5 w-5" style={{ color: "#E07B39" }} />
            {mode === "login" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription style={{ color: "#6B7280" }}>
            Create a free account to activate Wrenchli Pro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: "#9CA3AF" }}>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#2A2D37]"
              style={{ backgroundColor: "#1A1D27", color: "#F5F5F5" }}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: "#9CA3AF" }}>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-[#2A2D37]"
              style={{ backgroundColor: "#1A1D27", color: "#F5F5F5" }}
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-semibold"
            style={{ backgroundColor: "#E07B39", color: "#0F1117" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-[11px]" style={{ color: "#6B7280" }}>
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="underline" style={{ color: "#E07B39" }}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(""); }} className="underline" style={{ color: "#E07B39" }}>Sign in</button>
              </>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
