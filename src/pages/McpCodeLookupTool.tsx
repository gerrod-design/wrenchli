import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function CodeBlock({ text, label }: { text: string; label?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-[hsl(220,20%,12%)]">
      {label && (
        <div className="px-4 py-2 bg-[hsl(220,20%,15%)] border-b border-border/30">
          <span className="text-xs font-mono text-muted-foreground">{label}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[hsl(210,40%,85%)] font-mono whitespace-pre">{text}</code>
      </pre>
    </div>
  );
}

const KEY_REQUEST = `{
  "agent_name": "Your agent or product name",
  "developer_contact": "you@example.com"
}`;

const DTC_REQUEST = `POST https://www.wrenchli.net/mcp
Authorization: Bearer wk_YOUR_KEY
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "lookup_trouble_code",
    "arguments": { "code": "P0420" }
  }
}`;

const DTC_RESPONSE_NO_PRICE = `{
  "tool": "lookup_trouble_code",
  "found": true,
  "code": "P0420",
  "name": "Catalyst System Efficiency Below Threshold (Bank 1)",
  "meaning": "Your vehicle's catalytic converter isn't cleaning exhaust gases as effectively as it should. This could mean the catalytic converter is worn out, or it could be caused by an upstream issue like a failing oxygen sensor.",
  "common_causes": [
    "Worn or failing catalytic converter",
    "Faulty oxygen sensor (upstream or downstream)",
    "Exhaust leak before the catalytic converter",
    "Engine misfire causing unburned fuel to damage the converter"
  ],
  "causes_note": "Common causes, most frequently reported first. Treat this as a list of possibilities to discuss with a technician, not a verdict on your vehicle: the same code can have different causes on different vehicles.",
  "urgency": "medium",
  "urgency_note": "Worth scheduling a look soon. Most drivers can keep driving gently in the meantime; if the vehicle starts running worse, move it up.",
  "diy_feasibility": "advanced",
  "vehicle_context": null,
  "price": {
    "repair": {
      "id": "catalytic_converter",
      "label": "Catalytic Converter Replacement"
    },
    "published": false,
    "note": "No price is published for the repair this code points to yet, so none is shown here; the meaning above stands on its own."
  }
}`;

const DTC_RESPONSE_PRICED = `{
  "tool": "lookup_trouble_code",
  "found": true,
  "code": "P0128",
  "name": "Coolant Thermostat Below Thermostat Regulating Temperature",
  "meaning": "Your engine isn't warming up to its ideal operating temperature quickly enough. This usually means the thermostat is stuck open, letting coolant flow continuously and preventing the engine from reaching proper temperature.",
  "common_causes": [
    "Stuck-open thermostat",
    "Faulty engine coolant temperature sensor",
    "Low coolant level",
    "Thermostat housing leak"
  ],
  "causes_note": "Common causes, most frequently reported first. Treat this as a list of possibilities to discuss with a technician, not a verdict on your vehicle: the same code can have different causes on different vehicles.",
  "urgency": "low",
  "urgency_note": "Not urgent for most drivers: plan to have it looked at when convenient, and pay attention to any change in how the vehicle runs.",
  "diy_feasibility": "moderate",
  "vehicle_context": null,
  "price": {
    "repair": {
      "id": "thermostat",
      "label": "Thermostat Replacement"
    },
    "published": true,
    "range_usd": {
      "low": 160,
      "high": 535
    },
    "range_formatted": "$160–$535",
    "parts_usd": {
      "low": 60,
      "high": 137
    },
    "labor_usd": {
      "low": 100,
      "high": 400
    },
    "labor_hours": {
      "low": 1,
      "high": 2
    },
    "basis": {
      "framing": "Published Wrenchli price book range. The low end is a competent independent shop on quality aftermarket parts; the high end is a franchised dealership on factory (OEM) parts. Labor corridors: independent shops $100-$132 per hour, dealerships $140-$200 per hour.",
      "scope_note": "The service part is the thermostat housing assembly (thermostat integrated), not a bare thermostat.",
      "provenance": "Re-derived 2026-11-14 from named sources (founder-approved 2026-11-14): PartsGeek (Replacement $35.95 / Aisin $51.97 / NTC-TAMA $61.97 housing assemblies, street); AutoZone (Duralast housing assemblies $31.99–$63.99); Cars245 (genuine Toyota 16031-25010 at $137.38 retail, carried as $137). Independent parts = street price x published markup tier (65–90% under $200). Labor 1.0–2.0h (book; AutoZone 1–2h). Representative vehicle: 2019 Toyota Camry 2.5L.",
      "book_version": "v2"
    },
    "value_context": {
      "status": "not_available",
      "note": "Value context is not available yet: Wrenchli is validating a market value source for this slot, and until it checks out the repair range stands on its own. This slot is never filled with a guessed value.",
      "repair_range_usd": {
        "low": 160,
        "high": 535
      },
      "vehicle_value_usd": null,
      "vehicle_value_source": null,
      "vehicle_value_as_of": null,
      "repair_to_value_ratio": null,
      "repair_to_value_band": null
    },
    "note": "A published range is planning information, not a quote, bid, or guaranteed price; a shop prices the actual job after a hands-on look."
  }
}`;

export default function McpCodeLookupTool() {
  return (
    <>
      <SEO
        title="Trouble Code Lookup Tool — Wrenchli Developers"
        description="Reference for Wrenchli's lookup_trouble_code MCP tool: plain-language trouble code meanings, common causes, and urgency, with gated repair prices where the code maps to the price book."
        path="/developers/code-lookup"
      />

      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="container max-w-3xl mx-auto px-4">
          <Link to="/developers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to API Docs
          </Link>

          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
              MCP Tool Reference
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading">
              lookup_trouble_code
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Look up what a vehicle trouble code means in plain language, its common causes, and how urgent it is, over the Model Context Protocol.
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              A free key is required
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Every MCP tool call carries a free Wrenchli API key, so calls are attributable and
                rate-limited per caller. Keys are instant and self-serve: POST your agent name and
                a contact email, and the key is returned once. Send it as an
                <code className="font-mono text-foreground"> Authorization: Bearer </code>
                header (or <code className="font-mono text-foreground">x-api-key</code>) on each call.
              </p>
              <CodeBlock label="POST https://www.wrenchli.net/mcp-keys" text={KEY_REQUEST} />
              <p>
                The free taste tier allows 60 calls per minute per key. Calls are logged with their
                input shape (vehicle class, repair or code) and whether a figure was served; the log
                never carries a consumer's identity.
              </p>
            </div>
          </div>

          <div className="space-y-10">

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Request</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Call the tool over the MCP endpoint with the code as read from the vehicle.
                An optional vehicle object is carried as context.
              </p>
              <CodeBlock label="tools/call lookup_trouble_code" text={DTC_REQUEST} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Response: a code whose repair price is not published</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The meaning always returns: code meanings are Wrenchli's own educational content.
                The price block follows the same credibility gate as the price check tool, so this
                code's meaning stands on its own with no figure attached.
              </p>
              <CodeBlock label="structuredContent" text={DTC_RESPONSE_NO_PRICE} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Response: a code with a published price</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Where the code maps to a repair whose range passes the grading, the price block is
                the same shape the price check tool returns, basis included.
              </p>
              <CodeBlock label="structuredContent" text={DTC_RESPONSE_PRICED} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Coverage</h2>
              <p className="text-muted-foreground leading-relaxed">
                The library covers the codes drivers ask about most, from Wrenchli's published code
                pages, and returns an honest not-in-the-library answer for the rest. Common causes
                are possibilities to discuss with a technician, ordered most frequently reported
                first; the tool never turns them into a verdict on a specific vehicle.
              </p>
            </section>

          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            See also: <Link to="/developers/price-check" className="text-primary hover:underline">the repair price check tool</Link>,
            and the <Link to="/developers" className="text-primary hover:underline">developer documentation home</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
