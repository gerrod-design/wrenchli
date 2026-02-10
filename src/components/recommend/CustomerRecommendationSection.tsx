import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionReveal from "@/components/SectionReveal";
import StatCounter from "@/components/StatCounter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CustomerRecommendationSectionProps {
  onApply: () => void;
}

export default function CustomerRecommendationSection({ onApply }: CustomerRecommendationSectionProps) {
  const [checkOpen, setCheckOpen] = useState(false);
  const [shopQuery, setShopQuery] = useState("");
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (shopQuery.trim().length < 2) return;
    setChecked(true);
  };

  const resetCheck = () => {
    setShopQuery("");
    setChecked(false);
  };

  return (
    <>
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Your Customers Are Already Asking for You
            </h2>
            <p className="mt-4 text-wrenchli-trust-blue font-heading font-semibold text-lg">
              <StatCounter end={127} label="" /> shops have been recommended by their own customers to join Wrenchli.
              <span className="text-muted-foreground font-normal"> Is yours one of them?</span>
            </p>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Vehicle owners trust you. Now let them find you on the platform they're already using to diagnose their vehicles and compare repair options.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={onApply}
                className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Apply to Partner <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => { resetCheck(); setCheckOpen(true); }}
                variant="outline"
                className="h-12 px-8 border-wrenchli-trust-blue text-wrenchli-trust-blue hover:bg-wrenchli-trust-blue/10 font-semibold"
              >
                <Search className="mr-2 h-4 w-4" />
                Check If You've Been Recommended
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Check Recommendation Dialog */}
      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Check If You've Been Recommended</DialogTitle>
            <DialogDescription>
              Enter your shop name and we'll check if any of your customers have recommended you.
            </DialogDescription>
          </DialogHeader>

          {!checked ? (
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Your shop name"
                value={shopQuery}
                onChange={(e) => setShopQuery(e.target.value)}
                className="h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <Button
                onClick={handleCheck}
                disabled={shopQuery.trim().length < 2}
                className="w-full h-12 bg-wrenchli-trust-blue text-white hover:bg-wrenchli-trust-blue/90 font-semibold"
              >
                <Search className="mr-2 h-4 w-4" /> Check
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We don't have a match for <span className="font-semibold text-foreground">"{shopQuery}"</span> yet — but you can be the first to join and your customers will find you here.
              </p>
              <p className="text-sm text-muted-foreground">
                As we grow, customers in your area will be recommending shops just like yours. Get ahead of the curve.
              </p>
              <Button
                onClick={() => { setCheckOpen(false); onApply(); }}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                onClick={resetCheck}
                className="text-sm text-wrenchli-trust-blue hover:underline font-medium"
              >
                Try a different name
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
