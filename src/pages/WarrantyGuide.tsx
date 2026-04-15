import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowRight } from "lucide-react";

interface WarrantyRow {
  manufacturer: string;
  bumperToBumper: string;
  powertrain: string;
  corrosion: string;
  roadside: string;
  notes: string;
  highlightPowertrain?: boolean;
}

const warrantyData: WarrantyRow[] = [
  {
    manufacturer: "Toyota",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "2 years / unlimited miles",
    notes: "Hybrid battery: 10 yr / 150K mi. EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Honda",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "3 years / 36,000 miles",
    notes: "Hybrid/EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Ford",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "5 years / 60,000 miles",
    notes: "Diesel engines: 5 yr / 100K mi. EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Chevrolet",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "6 years / 100,000 miles",
    roadside: "5 years / 60,000 miles",
    notes: "EV battery: 8 yr / 100K mi with 75% capacity retention.",
  },
  {
    manufacturer: "RAM",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "10 years / 100,000 miles",
    corrosion: "5 years / 100,000 miles",
    roadside: "5 years / 100,000 miles",
    notes: "Extended powertrain coverage as of 2026 MY. HD diesel: 5 yr / 100K mi.",
    highlightPowertrain: true,
  },
  {
    manufacturer: "GMC",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "6 years / 100,000 miles",
    roadside: "5 years / 60,000 miles",
    notes: "Duramax/TurboMax: 5 yr / 100K mi. EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Jeep",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / 100,000 miles",
    roadside: "5 years / 60,000 miles",
    notes: "4xe PHEV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Dodge",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / 100,000 miles",
    roadside: "5 years / 60,000 miles",
    notes: "EV powertrain/battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Nissan",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "3 years / 36,000 miles",
    notes: "EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Hyundai",
    bumperToBumper: "5 years / 60,000 miles",
    powertrain: "10 years / 100,000 miles",
    corrosion: "7 years / unlimited miles",
    roadside: "5 years / unlimited miles",
    notes: "Industry-leading coverage. EV battery: 10 yr / 100K mi.",
    highlightPowertrain: true,
  },
  {
    manufacturer: "Kia",
    bumperToBumper: "5 years / 60,000 miles",
    powertrain: "10 years / 100,000 miles",
    corrosion: "5 years / 100,000 miles",
    roadside: "5 years / 60,000 miles",
    notes: "Best overall warranty. EV battery: 10 yr / 100K mi.",
    highlightPowertrain: true,
  },
  {
    manufacturer: "Subaru",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "3 years / 36,000 miles",
    notes: "Hybrid/EV battery: 8 yr / 100K mi with 70% retention.",
  },
  {
    manufacturer: "Mazda",
    bumperToBumper: "3 years / 36,000 miles",
    powertrain: "5 years / 60,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "3 years / 36,000 miles",
    notes: "PHEV battery: 8 yr / 100K mi with 70% retention.",
  },
  {
    manufacturer: "Volkswagen",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "4 years / 50,000 miles",
    corrosion: "7 years / unlimited miles",
    roadside: "3 years / 36,000 miles",
    notes: "EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "BMW",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "4 years / 50,000 miles",
    corrosion: "6 years / unlimited miles",
    roadside: "4 years / unlimited miles",
    notes: "EV/PHEV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Mercedes-Benz",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "4 years / 50,000 miles",
    corrosion: "4 years / 50,000 miles",
    roadside: "4 years / 50,000 miles",
    notes: "EQ sedan/SUV battery: 10 yr / 155K mi.",
  },
  {
    manufacturer: "Audi",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "4 years / 50,000 miles",
    corrosion: "12 years / unlimited miles",
    roadside: "4 years / unlimited miles",
    notes: "EV/PHEV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Lexus",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "6 years / 70,000 miles",
    corrosion: "6 years / unlimited miles",
    roadside: "4 years / unlimited miles",
    notes: "Hybrid battery: 10 yr / 150K mi. Top-rated dependability.",
  },
  {
    manufacturer: "Acura",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "6 years / 70,000 miles",
    corrosion: "5 years / unlimited miles",
    roadside: "4 years / 50,000 miles",
    notes: "EV battery: 8 yr / 100K mi.",
  },
  {
    manufacturer: "Infiniti",
    bumperToBumper: "4 years / 60,000 miles",
    powertrain: "6 years / 70,000 miles",
    corrosion: "7 years / unlimited miles",
    roadside: "4 years / unlimited miles",
    notes: "Above-average basic coverage at 60K miles.",
  },
  {
    manufacturer: "Tesla",
    bumperToBumper: "4 years / 50,000 miles",
    powertrain: "8 years / 100,000–150,000 miles",
    corrosion: "Not specified",
    roadside: "4 years / 50,000 miles",
    notes: "Battery varies by model: S/X 150K, 3/Y LR 120K, Standard 100K. 70% retention.",
  },
  {
    manufacturer: "Rivian",
    bumperToBumper: "5 years / 60,000 miles",
    powertrain: "8 years / 120,000–175,000 miles",
    corrosion: "8 years / unlimited miles",
    roadside: "5 years / 60,000 miles",
    notes: "Quad-motor: 175K mi. Dual-motor Large/Max: 150K mi. 70% retention.",
    highlightPowertrain: true,
  },
];

type SortKey = keyof WarrantyRow;
type SortDir = "asc" | "desc";

const warrantyJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Car Manufacturer Warranty Guide — What's Covered and for How Long",
  description:
    "Compare factory warranty coverage for all major car brands. See bumper-to-bumper, powertrain, and corrosion terms side by side.",
  author: { "@type": "Organization", name: "Wrenchli" },
  publisher: { "@type": "Organization", name: "Wrenchli", url: "https://wrenchli.net" },
  datePublished: "2026-04-10",
  dateModified: "2026-04-10",
  mainEntityOfPage: "https://wrenchli.net/warranty-guide",
};

export default function WarrantyGuide() {
  const [sortKey, setSortKey] = useState<SortKey>("manufacturer");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    return [...warrantyData].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "manufacturer", label: "Manufacturer" },
    { key: "bumperToBumper", label: "Bumper-to-Bumper" },
    { key: "powertrain", label: "Powertrain" },
    { key: "corrosion", label: "Corrosion / Rust" },
    { key: "roadside", label: "Roadside Assistance" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <main className="pb-[60px] md:pb-0" style={{ backgroundColor: "#F8F8F6" }}>
      <SEO
        title="Manufacturer Warranty Guide | Wrenchli"
        description="Understand what your vehicle manufacturer warranty covers before you pay for a repair out of pocket."
        path="/warranty-guide"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(warrantyJsonLd) }}
      />

      {/* Hero */}
      <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
        <div className="container-wrenchli max-w-4xl text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold leading-tight" style={{ color: "#1A1A1A" }}>
              Car Manufacturer Warranty Guide —{" "}
              <span style={{ color: "#E07B39" }}>What's Covered</span> and for How Long
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed max-w-3xl mx-auto" style={{ color: "#1A1A1A", opacity: 0.7 }}>
              Understanding your vehicle's factory warranty can save you thousands of dollars in repair costs. This guide shows coverage terms for major manufacturers sold in the US. Always verify current terms with your dealer as manufacturers update warranty programs periodically.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Table */}
      <section className="section-padding">
        <div className="container-wrenchli">
          <SectionReveal>
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-white shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#0F1117" }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/80 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => toggleSort(col.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr
                      key={row.manufacturer}
                      className={i % 2 === 0 ? "bg-white" : ""}
                      style={i % 2 !== 0 ? { backgroundColor: "#FAFAF8" } : undefined}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {row.manufacturer}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {row.bumperToBumper}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap font-medium"
                        style={
                          row.highlightPowertrain
                            ? { backgroundColor: "#FFF3E0", color: "#B55A1B" }
                            : undefined
                        }
                      >
                        {row.powertrain}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {row.corrosion}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {row.roadside}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[260px]">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Data sourced from manufacturer publications and Cars.com, January–April 2026. Highlighted cells indicate industry-leading powertrain coverage. Verify current terms with your dealer.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Post-warranty section */}
      <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              What to Do When Your Warranty Expires
            </h2>

            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              When your factory warranty ends, every repair bill is your responsibility. That alternator, catalytic converter, or transmission issue that would have been covered last month? Now it's $800, $1,500, or $4,000 out of your pocket. Knowing exactly when your coverage expires — and planning ahead — is the single best way to avoid sticker shock.
            </p>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Once you're out of warranty, understanding your car's symptoms before walking into a shop becomes critical. Without warranty protection, you're the one approving every dollar of work. A shop may recommend services you don't actually need, or quote a price well above the market rate. The more you understand about what's wrong, the harder it is for anyone to overcharge you.
            </p>

            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              That's where a quick symptom assessment pays for itself — even though it's free. Knowing the likely cause, the typical repair cost range, and whether it's something you can handle yourself gives you leverage in every conversation with a mechanic.
            </p>

            <div className="mt-8 rounded-xl border border-border/50 bg-white p-6 md:p-8">
              <p className="text-base font-semibold text-foreground leading-relaxed">
                Before your next shop visit, get a free Wrenchli symptom assessment to understand what's wrong and what it should cost — before you approve a single dollar of work.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-5 h-12 px-8 font-bold text-base transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: "#E07B39", color: "white" }}
              >
                <Link to="/#quote" className="inline-flex items-center gap-2">
                  Get Your Free Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
