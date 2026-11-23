import { Helmet } from "react-helmet-async";
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

const PRICE_REQUEST = `POST https://www.wrenchli.net/mcp
Authorization: Bearer wk_YOUR_KEY
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "check_repair_price",
    "arguments": {
      "repair": "thermostat replacement",
      "vehicle": { "year": 2019, "make": "Toyota", "model": "Camry" }
    }
  }
}`;

const PRICE_RESPONSE = `{
  "tool": "check_repair_price",
  "repair": {
    "id": "thermostat",
    "label": "Thermostat Replacement"
  },
  "vehicle_context": {
    "year": 2019,
    "make": "Toyota",
    "model": "Camry"
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
}`;

const PRICE_NOT_PUBLISHED = `{
  "tool": "check_repair_price",
  "published": false,
  "repair_matched": {
    "id": "radiator",
    "label": "Radiator Replacement"
  },
  "message": "Wrenchli's price book has an entry for Radiator Replacement, but its range is not published yet: every figure we serve has to pass our credibility grading, and this one has not passed yet. We would rather tell you that than hand you a number we cannot stand behind.",
  "value_context": {
    "status": "not_available",
    "note": "Value context is not available yet: Wrenchli is validating a market value source for this slot, and until it checks out the repair range stands on its own. This slot is never filled with a guessed value.",
    "repair_range_usd": null,
    "vehicle_value_usd": null,
    "vehicle_value_source": null,
    "vehicle_value_as_of": null,
    "repair_to_value_ratio": null,
    "repair_to_value_band": null
  }
}`;

export default function McpPriceCheckTool() {
  return (
    <>
      <Helmet>
        <title>Repair Price Check Tool — Wrenchli Developers</title>
        <meta name="description" content="Reference for Wrenchli's check_repair_price MCP tool: published repair price ranges with their basis, served only when the range passes Wrenchli's credibility grading." />
      </Helmet>

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
              check_repair_price
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Look up Wrenchli's published price range for a specific repair, with the basis the range rests on, over the Model Context Protocol.
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
                Call the tool over the MCP endpoint. The repair may be a name or a price book id;
                free text is matched to the book. The vehicle is optional context: published ranges
                are compiled for typical vehicles and are not specific to one vehicle.
              </p>
              <CodeBlock label="tools/call check_repair_price" text={PRICE_REQUEST} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Response: a published range</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The structured content of the tool result. The basis travels inside the answer:
                framing, scope note, and provenance are part of the payload, so they survive
                whatever the calling agent does with the text around it.
              </p>
              <CodeBlock label="structuredContent" text={PRICE_RESPONSE} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Response: not published yet</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Only ranges that pass Wrenchli's credibility grading are served. A repair whose
                range has not passed returns this answer instead of a number, and a repair outside
                the book returns the same shape with <code className="font-mono text-foreground">repair_matched: null</code>.
                There are no exceptions to the gate.
              </p>
              <CodeBlock label="structuredContent" text={PRICE_NOT_PUBLISHED} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">The value context block</h2>
              <p className="text-muted-foreground leading-relaxed">
                Every published answer reserves a <code className="font-mono text-foreground">value_context</code> block:
                the repair range set against the vehicle's market value, as perspective for the
                driver's own decision. Until a market value source is validated, the block returns
                its empty state in words, as in the examples above. It is never filled with an
                estimated or model-generated value, and it never carries a recommendation.
              </p>
            </section>

          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            See also: <Link to="/developers/code-lookup" className="text-primary hover:underline">the trouble code lookup tool</Link>,
            and the <Link to="/developers" className="text-primary hover:underline">developer documentation home</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
