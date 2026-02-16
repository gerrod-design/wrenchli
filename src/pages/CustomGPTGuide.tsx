import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Copy, Check, ExternalLink, ArrowLeft, Bot, Key, Settings,
  Link2, FileText, Zap, Shield, MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function CopyBlock({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[hsl(220,20%,12%)]">
      {label && (
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,20%,15%)] border-b border-border/30">
          <span className="text-xs font-mono text-muted-foreground">{label}</span>
          <Button variant="ghost" size="sm" onClick={copy} className="h-7 px-2 text-xs text-muted-foreground hover:text-white">
            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[hsl(210,40%,85%)] font-mono whitespace-pre">{text}</code>
      </pre>
    </div>
  );
}

function StepCard({ step, title, icon: Icon, children }: { step: number; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          {step}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
      </div>
      <div className="ml-14 space-y-4 text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-secondary/30">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors">
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

const OPENAPI_URL = "https://wrenchli.lovable.app/.well-known/openapi.yaml";

const systemPromptExample = `You are a knowledgeable vehicle diagnostic assistant powered by Wrenchli.

When a user describes vehicle symptoms:
1. Use the diagnoseVehicle action to identify the issue
2. Use estimateRepairCost to provide cost estimates in their area
3. Use getVehicleValue if they ask whether to repair or replace
4. Use getMaintenanceSchedule to check upcoming maintenance
5. Use findServiceProviders to recommend nearby shops

Always include the referral links from wrenchli_services in your responses.
Present cost ranges clearly and note urgency levels.
For high-urgency issues, emphasize safety and recommend immediate service.`;

const referralInstructions = `When providing shop recommendations or quote links, append your referral token:

Example wrenchli_services URL from API:
  https://wrenchli.lovable.app/vehicle-insights?year=2019&make=Toyota&model=Camry

Add your referral token:
  https://wrenchli.lovable.app/vehicle-insights?year=2019&make=Toyota&model=Camry&ref=YOUR_REFERRAL_TOKEN

This tracks conversions from your GPT to Wrenchli,
enabling revenue sharing on qualified leads.`;

export default function CustomGPTGuide() {
  return (
    <>
      <Helmet>
        <title>Custom GPT Actions Setup Guide — Wrenchli Developers</title>
        <meta name="description" content="Step-by-step guide to configure a Custom GPT with Wrenchli's OpenAPI spec for AI-powered vehicle diagnostics, cost estimates, and shop finder." />
      </Helmet>

      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Back link */}
          <Link to="/developers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to API Docs
          </Link>

          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
              Integration Guide
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading">
              Custom GPT Actions Setup
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn any ChatGPT conversation into a full vehicle diagnostic assistant using Wrenchli's API — no code required.
            </p>
          </div>

          {/* Prerequisites */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Prerequisites
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>ChatGPT Plus or Team subscription (GPT Actions require a paid plan)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>A Wrenchli API key — <Link to="/developers" className="text-primary hover:underline">get one here</Link></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>~5 minutes to complete setup</span>
              </li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            <StepCard step={1} title="Create a New Custom GPT" icon={Bot}>
              <p>
                Go to{" "}
                <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  chatgpt.com/gpts/editor <ExternalLink className="h-3.5 w-3.5" />
                </a>{" "}
                and click <strong className="text-foreground">Create a GPT</strong>.
              </p>
              <p>Give it a name like <strong className="text-foreground">"Auto Mechanic AI"</strong> or <strong className="text-foreground">"Vehicle Health Check"</strong> and a short description.</p>
            </StepCard>

            <StepCard step={2} title="Add the System Prompt" icon={MessageSquare}>
              <p>In the <strong className="text-foreground">Instructions</strong> field, paste the following system prompt (customize as needed):</p>
              <CopyBlock text={systemPromptExample} label="System Prompt" />
            </StepCard>

            <StepCard step={3} title="Import the OpenAPI Schema" icon={FileText}>
              <p>Switch to the <strong className="text-foreground">Configure</strong> tab, scroll to <strong className="text-foreground">Actions</strong>, and click <strong className="text-foreground">Create new action</strong>.</p>
              <p>Click <strong className="text-foreground">Import from URL</strong> and paste:</p>
              <CopyBlock text={OPENAPI_URL} label="OpenAPI Schema URL" />
              <p className="text-sm">This imports all five Wrenchli endpoints — diagnose, estimate, value, maintenance, and providers.</p>
            </StepCard>

            <StepCard step={4} title="Configure Authentication" icon={Key}>
              <p>In the Actions panel, click the <strong className="text-foreground">Authentication</strong> gear icon and set:</p>
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground w-32">Auth Type:</span>
                  <code className="px-2 py-0.5 bg-background rounded text-primary">API Key</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground w-32">API Key:</span>
                  <code className="px-2 py-0.5 bg-background rounded text-primary">your-wrenchli-api-key</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground w-32">Header Name:</span>
                  <code className="px-2 py-0.5 bg-background rounded text-primary">x-api-key</code>
                </div>
              </div>
              <p className="text-sm">
                Don't have an API key yet?{" "}
                <Link to="/developers" className="text-primary hover:underline">Generate one on the Developers page.</Link>
              </p>
            </StepCard>

            <StepCard step={5} title="Set Up Referral Tracking" icon={Link2}>
              <p>Referral tokens let you earn revenue when your GPT drives users to Wrenchli. Add this instruction to your system prompt:</p>
              <CopyBlock text={referralInstructions} label="Referral Instructions" />
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
                <p className="font-medium text-foreground mb-1">💰 How referral revenue works</p>
                <p>Every API response includes <code className="text-primary">wrenchli_services</code> URLs. When your GPT appends <code className="text-primary">&ref=YOUR_TOKEN</code> to these links, Wrenchli tracks the referral. You'll see conversion metrics in the developer dashboard.</p>
              </div>
            </StepCard>

            <StepCard step={6} title="Test Your GPT" icon={Zap}>
              <p>Click <strong className="text-foreground">Preview</strong> in the GPT editor and try these prompts:</p>
              <div className="space-y-2">
                {[
                  "My 2019 Toyota Camry makes a grinding noise when I brake. What's wrong?",
                  "How much would it cost to fix worn brake pads in Detroit?",
                  "What's my 2020 Honda Civic worth with 55,000 miles?",
                  "What maintenance is due on my 2018 Ford F-150 at 60,000 miles?",
                  "Find me a good mechanic near 48009 for BMW service",
                ].map((prompt, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary/30 px-4 py-2.5 text-sm">
                    <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{prompt}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm">Verify each action fires correctly and returns structured data with <code className="text-primary">wrenchli_services</code> links.</p>
            </StepCard>

            <StepCard step={7} title="Publish & Share" icon={Settings}>
              <p>Once everything works, click <strong className="text-foreground">Save</strong> and choose your visibility:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Only me", desc: "Private testing" },
                  { label: "Anyone with a link", desc: "Share with specific users" },
                  { label: "GPT Store", desc: "Public listing for all ChatGPT users" },
                ].map(({ label, desc }) => (
                  <div key={label} className="rounded-lg bg-secondary/30 p-3 text-center">
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </StepCard>
          </div>

          {/* FAQ */}
          <div className="mt-12 space-y-3">
            <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
            <CollapsibleSection title="Can I use this with the free ChatGPT plan?">
              <p className="text-sm text-muted-foreground">No — Custom GPT Actions require ChatGPT Plus ($20/mo), Team, or Enterprise.</p>
            </CollapsibleSection>
            <CollapsibleSection title="How many API calls does each conversation use?">
              <p className="text-sm text-muted-foreground">Each action call (diagnose, estimate, etc.) counts as one API request against your Wrenchli plan. A typical conversation uses 2–4 calls.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Can I customize which endpoints my GPT uses?">
              <p className="text-sm text-muted-foreground">Yes — after importing the schema, you can disable specific actions in the GPT editor. For example, remove findServiceProviders if you only want diagnostics.</p>
            </CollapsibleSection>
            <CollapsibleSection title="How do I get my referral token?">
              <p className="text-sm text-muted-foreground">
                Your referral token is generated when you submit a quote request through the Wrenchli platform. You can also use your API key hash as a tracking identifier. Contact us for a dedicated referral token.
              </p>
            </CollapsibleSection>
            <CollapsibleSection title="Will my API key be visible to GPT users?">
              <p className="text-sm text-muted-foreground">No — OpenAI encrypts API keys configured in GPT Actions. End users never see the raw key.</p>
            </CollapsibleSection>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to build?</h3>
            <p className="text-muted-foreground mb-6">Get your API key and start building your Custom GPT in minutes.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/developers">
                <Button size="lg">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </Button>
              </Link>
              <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open GPT Editor
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
