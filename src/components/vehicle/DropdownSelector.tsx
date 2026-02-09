const modelsByMake: Record<string, string[]> = {
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco", "Ranger", "Expedition", "Fusion", "Focus"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Camaro", "Tahoe", "Suburban", "Colorado", "Blazer", "Trax"],
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna", "Supra"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V", "Odyssey", "Ridgeline", "Passport", "Fit", "Insight"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
  GMC: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon", "Hummer EV"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Venue", "Ioniq 5"],
  Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul", "Seltos", "EV6"],
  Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Murano", "Kicks", "Versa"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "4 Series", "7 Series", "iX"],
  Mercedes: ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class", "GLA", "GLB"],
};

const makes = Object.keys(modelsByMake).concat("Other");

const selectClass =
  "flex h-12 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  year: string;
  make: string;
  model: string;
  onYearChange: (v: string) => void;
  onMakeChange: (v: string) => void;
  onModelChange: (v: string) => void;
}

export default function DropdownSelector({ year, make, model, onYearChange, onMakeChange, onModelChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <select value={year} onChange={(e) => onYearChange(e.target.value)} className={selectClass}>
        <option value="">Year</option>
        {Array.from({ length: 27 }, (_, i) => 2026 - i).map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={make}
        onChange={(e) => { onMakeChange(e.target.value); onModelChange(""); }}
        className={selectClass}
      >
        <option value="">Make</option>
        {makes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select value={model} onChange={(e) => onModelChange(e.target.value)} className={selectClass}>
        <option value="">Model</option>
        {(modelsByMake[make] || []).map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

export { modelsByMake, makes };
