import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Copy, Check, Terminal, Code2, Zap, Shield, Key, ExternalLink, DollarSign, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const FUNCTIONS_BASE = "https://etytcjxqqjzpalehqoib.supabase.co/functions/v1";
const BASE_URL = `${FUNCTIONS_BASE}/api-diagnose`;
const ESTIMATE_URL = `${FUNCTIONS_BASE}/api-estimate-repair`;
const VALUE_URL = `${FUNCTIONS_BASE}/api-vehicle-value`;
const MAINT_URL = `${FUNCTIONS_BASE}/api-maintenance-schedule`;

const maintCurlExample = `curl -X POST "${MAINT_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2019,
      "mileage": 47000
    },
    "last_services": [
      { "type": "oil_change", "mileage": 45000 },
      { "type": "tire_rotation", "mileage": 42000 }
    ]
  }'`;

const maintPythonExample = `import requests

API_KEY = "YOUR_API_KEY"
URL = "${MAINT_URL}"

response = requests.post(
    URL,
    headers={
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    },
    json={
        "vehicle": {
            "make": "Toyota",
            "model": "Camry",
            "year": 2019,
            "mileage": 47000,
        },
        "last_services": [
            {"type": "oil_change", "mileage": 45000},
            {"type": "tire_rotation", "mileage": 42000},
        ],
    },
)

data = response.json()
print(f"Upcoming items: {data['summary']['total_items']}")
for svc in data['upcoming_services']:
    if svc['priority'] in ('overdue', 'urgent'):
        print(f"  ⚠ {svc['label']}: {svc['priority']} ({svc['miles_until_due']} mi)")`;

const maintJsExample = `const API_KEY = "YOUR_API_KEY";
const URL = "${MAINT_URL}";

const response = await fetch(URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  body: JSON.stringify({
    vehicle: { make: "Toyota", model: "Camry", year: 2019, mileage: 47000 },
    last_services: [
      { type: "oil_change", mileage: 45000 },
      { type: "tire_rotation", mileage: 42000 },
    ],
  }),
});

const data = await response.json();
console.log(\`Upcoming: \${data.summary.total_items} items\`);
data.upcoming_services
  .filter(s => s.priority === "overdue" || s.priority === "urgent")
  .forEach(s => console.log(\`  ⚠ \${s.label}: \${s.priority}\`));`;

const maintSampleResponse = `{
  "vehicle_summary": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2019,
    "mileage": 47000
  },
  "full_schedule": [
    {
      "type": "oil_change",
      "label": "Oil Change",
      "interval_miles": 5000,
      "interval_months": 6,
      "estimated_cost_low": 30,
      "estimated_cost_high": 75,
      "priority": "essential",
      "description": "Replace engine oil and filter..."
    }
  ],
  "upcoming_services": [
    {
      "type": "tire_rotation",
      "label": "Tire Rotation",
      "due_mileage": 49500,
      "miles_until_due": 2500,
      "priority": "soon",
      "estimated_cost_low": 25,
      "estimated_cost_high": 50,
      "description": "Even out tire wear..."
    },
    {
      "type": "oil_change",
      "label": "Oil Change",
      "due_mileage": 50000,
      "miles_until_due": 3000,
      "priority": "upcoming",
      "estimated_cost_low": 30,
      "estimated_cost_high": 75,
      "description": "Replace engine oil and filter..."
    }
  ],
  "summary": {
    "total_items": 10,
    "overdue_count": 0,
    "urgent_count": 0,
    "estimated_total_cost_low": 535,
    "estimated_total_cost_high": 1375
  },
  "wrenchli_services": {
    "garage_url": "https://wrenchli.lovable.app/garage",
    "vehicle_insights_url": "https://wrenchli.lovable.app/vehicle-insights"
  }
}`;

const valueCurlExample = `curl -X POST "${VALUE_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "vehicle": {
      "year": 2020,
      "make": "Toyota",
      "model": "Camry",
      "mileage": 45000,
      "zipCode": "90210"
    },
    "repair_cost": 1500
  }'`;

const valuePythonExample = `import requests

API_KEY = "YOUR_API_KEY"
URL = "${VALUE_URL}"

response = requests.post(
    URL,
    headers={
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    },
    json={
        "vehicle": {
            "year": 2020,
            "make": "Toyota",
            "model": "Camry",
            "mileage": 45000,
            "zipCode": "90210",
        },
        "repair_cost": 1500,
    },
)

data = response.json()
print(f"Vehicle Value: \${data['current_value']:,}")
print(f"Trend: {data['market_analysis']['trend']}")
if data['market_analysis'].get('trade_vs_repair'):
    rec = data['market_analysis']['trade_vs_repair']
    print(f"Recommendation: {rec['recommendation']}")
    print(f"Repair is {rec['repair_percentage']}% of vehicle value")`;

const valueJsExample = `const API_KEY = "YOUR_API_KEY";
const URL = "${VALUE_URL}";

const response = await fetch(URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  body: JSON.stringify({
    vehicle: {
      year: 2020,
      make: "Toyota",
      model: "Camry",
      mileage: 45000,
      zipCode: "90210",
    },
    repair_cost: 1500,
  }),
});

const data = await response.json();
console.log(\`Vehicle Value: $\${data.current_value.toLocaleString()}\`);
console.log(\`Market Trend: \${data.market_analysis.trend}\`);
if (data.market_analysis.trade_vs_repair) {
  const rec = data.market_analysis.trade_vs_repair;
  console.log(\`Recommendation: \${rec.recommendation}\`);
  console.log(\`Repair is \${rec.repair_percentage}% of vehicle value\`);
}`;

const valueSampleResponse = `{
  "current_value": 9592,
  "confidence": 85,
  "value_breakdown": {
    "base_msrp": 24095,
    "age_depreciation": 18071,
    "mileage_adjustment": -4050,
    "regional_adjustment": 482
  },
  "market_analysis": {
    "trend": "stable",
    "optimal_sell_window": true,
    "trade_vs_repair": {
      "repair_percentage": 16,
      "recommendation": "repair_recommended",
      "reasoning": "At 16% of vehicle value, repair is still the better financial choice..."
    }
  },
  "wrenchli_services": {
    "detailed_analysis_url": "https://wrenchli.lovable.app/garage",
    "get_quotes_url": "https://wrenchli.lovable.app/vehicle-insights?year=2020&make=Toyota&model=Camry",
    "garage_management_url": "https://wrenchli.lovable.app/garage"
  }
}`;

const curlExample = `curl -X POST "${BASE_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "symptoms": ["grinding noise when braking", "vibration in steering wheel"],
    "vehicle": {
      "year": 2019,
      "make": "Toyota",
      "model": "Camry",
      "mileage": 45000
    },
    "location": "90210"
  }'`;

const pythonExample = `import requests

API_KEY = "YOUR_API_KEY"
URL = "${BASE_URL}"

response = requests.post(
    URL,
    headers={
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    },
    json={
        "symptoms": ["grinding noise when braking", "vibration in steering wheel"],
        "vehicle": {
            "year": 2019,
            "make": "Toyota",
            "model": "Camry",
            "mileage": 45000,
        },
        "location": "90210",
    },
)

data = response.json()
print(f"Issue: {data['diagnosis']['probable_issue']}")
print(f"Urgency: {data['diagnosis']['urgency']}")
print(f"Cost: $" + str(data['diagnosis']['cost_estimate']['min']) + "-$" + str(data['diagnosis']['cost_estimate']['max']))`;

const jsExample = `const API_KEY = "YOUR_API_KEY";
const URL = "${BASE_URL}";

const response = await fetch(URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  body: JSON.stringify({
    symptoms: ["grinding noise when braking", "vibration in steering wheel"],
    vehicle: {
      year: 2019,
      make: "Toyota",
      model: "Camry",
      mileage: 45000,
    },
    location: "90210",
  }),
});

const data = await response.json();
console.log(\`Issue: \${data.diagnosis.probable_issue}\`);
console.log(\`Urgency: \${data.diagnosis.urgency}\`);
console.log(\`Cost: $\${data.diagnosis.cost_estimate.min}-$\${data.diagnosis.cost_estimate.max}\`);`;

const sampleResponse = `{
  "diagnosis": {
    "probable_issue": "Brake System Issue",
    "description": "Grinding noises typically indicate worn brake pads...",
    "urgency": "high",
    "cost_estimate": { "min": 200, "max": 600 }
  },
  "recommendations": {
    "immediate_action": "Schedule brake inspection within 48 hours",
    "safety_advice": "Avoid heavy braking and increase following distance",
    "diy_feasible": false
  },
  "wrenchli_services": {
    "get_quotes_url": "https://wrenchli.lovable.app/vehicle-insights?...",
    "find_shops_url": "https://wrenchli.lovable.app/for-shops"
  }
}`;

const estimateCurlExample = `curl -X POST "${ESTIMATE_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "diagnosis_title": "Worn Brake Pads",
    "diagnosis_code": "",
    "vehicle_year": "2019",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "zip_code": "48201",
    "urgency": "high"
  }'`;

const estimateSampleResponse = `{
  "metro_area": "Detroit Metro Area",
  "cost_low": 200,
  "cost_high": 450,
  "parts_estimate": "$80–$150",
  "labor_estimate": "$120–$300",
  "labor_hours": "1.5–2.5 hours",
  "regional_notes": "Detroit area labor rates average $95–$130/hr",
  "what_to_expect": "Technician will replace worn brake pads and inspect rotors for damage.",
  "warranty_note": "Most shops offer 12-month/12,000-mile warranty on brake work"
}`;

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[hsl(220,20%,12%)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,20%,15%)] border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[hsl(210,40%,85%)] font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Developers() {
  return (
    <>
      <Helmet>
        <title>API Documentation — Wrenchli Developers</title>
        <meta name="description" content="Integrate Wrenchli's AI-powered vehicle diagnostics into your app. Code examples in Python, JavaScript, and curl." />
      </Helmet>

      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
              Developer API
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-heading">
              Wrenchli Diagnostic API
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Add AI-powered vehicle diagnostics to any application. Get instant problem identification, urgency ratings, cost estimates, and repair recommendations.
            </p>
          </div>

          {/* Quick info pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { icon: Zap, label: "REST API" },
              { icon: Shield, label: "API Key Auth" },
              { icon: Terminal, label: "JSON Response" },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                <I className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {/* Authentication */}
            <SectionCard icon={Key} title="Authentication">
              <p className="text-muted-foreground mb-4">
                All requests require an API key passed via the <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">x-api-key</code> header. Contact us to obtain your key.
              </p>
              <a href="/contact" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Request an API Key <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </SectionCard>

            {/* Endpoint */}
            <SectionCard icon={Terminal} title="Endpoint">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm mb-4">
                <span className="font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded mr-2">POST</span>
                <span className="text-foreground break-all">/api-diagnose</span>
              </div>

              <h3 className="font-semibold text-foreground mb-2">Request Body</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Field</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Required</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      ["symptoms", "string[]", "Yes", "List of symptoms (e.g. \"grinding noise\")"],
                      ["vehicle.year", "number", "Yes", "Model year"],
                      ["vehicle.make", "string", "Yes", "Manufacturer (e.g. Toyota)"],
                      ["vehicle.model", "string", "Yes", "Model name (e.g. Camry)"],
                      ["vehicle.mileage", "number", "No", "Current odometer reading"],
                      ["location", "string", "No", "ZIP code for local recommendations"],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{field}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{type}</td>
                        <td className="py-2 pr-4">
                          {req === "Yes" ? (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Optional</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Code Examples */}
            <SectionCard icon={Code2} title="Code Examples">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={curlExample} language="bash" />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={pythonExample} language="python" />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock code={jsExample} language="javascript" />
                </TabsContent>
              </Tabs>
            </SectionCard>

            {/* Sample Response */}
            <SectionCard icon={Terminal} title="Sample Response">
              <CodeBlock code={sampleResponse} language="json" />
            </SectionCard>

            {/* Estimate Repair Endpoint */}
            <div className="pt-4 border-t border-border">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Endpoint #2
              </Badge>
            </div>

            <SectionCard icon={Terminal} title="Repair Cost Estimate">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm mb-4">
                <span className="font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded mr-2">POST</span>
                <span className="text-foreground break-all">/api-estimate-repair</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Get an AI-powered, ZIP-code-localized repair cost estimate with parts/labor breakdown. Uses the same API key authentication.
              </p>

              <h3 className="font-semibold text-foreground mb-2">Request Body</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Field</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Required</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      ["diagnosis_title", "string", "Yes", "The diagnosed issue (e.g. \"Worn Brake Pads\")"],
                      ["zip_code", "string", "Yes", "5-digit US ZIP code for localized pricing"],
                      ["diagnosis_code", "string", "No", "DTC code if applicable (e.g. P0420)"],
                      ["vehicle_year", "string", "No", "Vehicle model year"],
                      ["vehicle_make", "string", "No", "Vehicle manufacturer"],
                      ["vehicle_model", "string", "No", "Vehicle model"],
                      ["vehicle_trim", "string", "No", "Vehicle trim level"],
                      ["diy_feasibility", "string", "No", "DIY difficulty (easy, moderate, advanced)"],
                      ["urgency", "string", "No", "Urgency level (low, medium, high)"],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{field}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{type}</td>
                        <td className="py-2 pr-4">
                          {req === "Yes" ? (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Optional</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-foreground mb-2">Example Request</h3>
              <div className="mb-6">
                <CodeBlock code={estimateCurlExample} language="bash" />
              </div>

              <h3 className="font-semibold text-foreground mb-2">Sample Response</h3>
              <CodeBlock code={estimateSampleResponse} language="json" />
            </SectionCard>

            {/* Vehicle Value Endpoint */}
            <div className="pt-4 border-t border-border">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Endpoint #3
              </Badge>
            </div>

            <SectionCard icon={DollarSign} title="Vehicle Value & Repair-vs-Replace">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm mb-4">
                <span className="font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded mr-2">POST</span>
                <span className="text-foreground break-all">/api-vehicle-value</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Get an instant vehicle market valuation with depreciation breakdown, market trend analysis, and an optional repair-vs-replace recommendation when a repair cost is provided. Uses the same API key authentication.
              </p>

              <h3 className="font-semibold text-foreground mb-2">Request Body</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Field</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Required</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      ["vehicle.year", "number", "Yes", "Model year (1990–current+1)"],
                      ["vehicle.make", "string", "Yes", "Manufacturer (e.g. Toyota)"],
                      ["vehicle.model", "string", "Yes", "Model name (e.g. Camry)"],
                      ["vehicle.mileage", "number", "Yes", "Current odometer reading (0–500,000)"],
                      ["vehicle.zipCode", "string", "No", "5-digit ZIP code for regional context"],
                      ["repair_cost", "number", "No", "Repair cost to trigger repair-vs-replace analysis"],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{field}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{type}</td>
                        <td className="py-2 pr-4">
                          {req === "Yes" ? (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Optional</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-foreground mb-2">Code Examples</h3>
              <Tabs defaultValue="curl" className="w-full mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={valueCurlExample} language="bash" />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={valuePythonExample} language="python" />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock code={valueJsExample} language="javascript" />
                </TabsContent>
              </Tabs>

              <h3 className="font-semibold text-foreground mb-2">Sample Response</h3>
              <CodeBlock code={valueSampleResponse} language="json" />

              <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Tip:</strong> Omit <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">repair_cost</code> to get a pure valuation without the repair-vs-replace analysis. The <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">trade_vs_repair</code> field will be absent from the response.
              </div>
            </SectionCard>

            {/* Maintenance Schedule Endpoint */}
            <div className="pt-4 border-t border-border">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Endpoint #4
              </Badge>
            </div>

            <SectionCard icon={Wrench} title="Maintenance Schedule Lookup">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm mb-4">
                <span className="font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded mr-2">POST</span>
                <span className="text-foreground break-all">/api-maintenance-schedule</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Get a full maintenance schedule with brand-specific adjustments (e.g. BMW extended oil intervals, Tesla EV exclusions), upcoming service items sorted by urgency, and cost estimates. Provide optional last-service records for accurate due-date calculation.
              </p>

              <h3 className="font-semibold text-foreground mb-2">Request Body</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Field</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Required</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      ["vehicle.make", "string", "Yes", "Manufacturer (e.g. Toyota, BMW, Tesla)"],
                      ["vehicle.mileage", "number", "Yes", "Current odometer reading (0–500,000)"],
                      ["vehicle.model", "string", "No", "Model name (e.g. Camry)"],
                      ["vehicle.year", "number", "No", "Model year"],
                      ["last_services", "array", "No", "Array of {type, mileage} for last service records"],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{field}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{type}</td>
                        <td className="py-2 pr-4">
                          {req === "Yes" ? (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Optional</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-foreground mb-2">Code Examples</h3>
              <Tabs defaultValue="curl" className="w-full mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={maintCurlExample} language="bash" />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={maintPythonExample} language="python" />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock code={maintJsExample} language="javascript" />
                </TabsContent>
              </Tabs>

              <h3 className="font-semibold text-foreground mb-2">Sample Response</h3>
              <CodeBlock code={maintSampleResponse} language="json" />

              <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Tip:</strong> Omit <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">last_services</code> to get the full schedule with all items calculated from 0 miles. The <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">priority</code> field uses: <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">overdue</code>, <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">urgent</code> (≤1,000 mi), <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">soon</code> (≤3,000 mi), <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">upcoming</code>.
              </div>
            </SectionCard>

            {/* Error Codes */}
            <SectionCard icon={Shield} title="Error Codes">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      ["400", "Invalid request — missing symptoms or vehicle info"],
                      ["401", "Missing API key"],
                      ["403", "Invalid or deactivated API key"],
                      ["429", "Rate limit exceeded — retry after 60 seconds"],
                      ["500", "Internal server error"],
                    ].map(([code, desc]) => (
                      <tr key={code} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono font-semibold">{code}</td>
                        <td className="py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Rate Limits */}
            <SectionCard icon={Zap} title="Rate Limits">
              <p className="text-muted-foreground">
                Each API key has a configurable rate limit (default: <strong className="text-foreground">30 requests/minute</strong>). 
                If exceeded, the API returns <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">429</code> with 
                a <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">Retry-After: 60</code> header.
              </p>
            </SectionCard>

            {/* ChatGPT Plugin */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/15">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">AI Platform Integration</h2>
              </div>
              <p className="text-muted-foreground mb-3">
                Wrenchli supports the ChatGPT plugin standard. AI platforms can auto-discover the API via:
              </p>
              <div className="space-y-2 font-mono text-sm">
                <div className="rounded-lg bg-muted p-3 break-all">
                  <span className="text-muted-foreground">Plugin manifest: </span>
                  <a href="/.well-known/ai-plugin.json" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    /.well-known/ai-plugin.json
                  </a>
                </div>
                <div className="rounded-lg bg-muted p-3 break-all">
                  <span className="text-muted-foreground">OpenAPI spec: </span>
                  <a href="/.well-known/openapi.yaml" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    /.well-known/openapi.yaml
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
