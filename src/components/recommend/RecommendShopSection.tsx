import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/SectionReveal";


interface RecommendShopSectionProps {
  onOpenModal: () => void;
}

export default function RecommendShopSection({ onOpenModal }: RecommendShopSectionProps) {
  return (
    <section className="section-padding" style={{ backgroundColor: "hsl(170 76% 96%)" }}>
      <div className="container-wrenchli text-center">
        <SectionReveal>
          <h2 className="font-heading text-2xl font-bold md:text-4xl text-foreground">
            Know a Great Mechanic?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
            Great mechanics don't always have great marketing. Know a hidden gem? Tell us about the shop you trust.
          </p>
          <Button
            onClick={onOpenModal}
            className="mt-6 h-12 px-8 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold text-base"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Recommend a Shop
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Takes 30 seconds. Your mechanic will thank you.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
