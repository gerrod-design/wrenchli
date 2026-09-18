import { Helmet } from "react-helmet-async";
import SEO from "@/components/SEO";
import SampleTechProfile from "@/components/shops/SampleTechProfile";

/**
 * Demo-only route for the buildathon pitch. NOT linked from the directory
 * index. Renders the watermarked sample technician profile.
 */
export default function DemoTechProfile() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Sample Technician Profile"
        description="Illustrative mockup of a Wrenchli technician profile — not a real person."
        path="/shops/demo-tech-profile"
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SampleTechProfile />
    </main>
  );
}
