import { useState, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/audit-wrenchli-site`;

const AGENTS = [
  { id: "conversion", name: "Conversion Analyst", icon: "◈", color: "#E07B39", bg: "#FEF3EA", description: "CRO audit on homepage, /for-shops, and /garage" },
  { id: "shopPersona", name: "Shop Owner Persona", icon: "◉", color: "#1D9E75", bg: "#E1F5EE", description: "Independent shop owner deciding whether to join" },
  { id: "consumerJourney", name: "Consumer Journey Tester", icon: "◎", color: "#378ADD", bg: "#E6F1FB", description: "Vehicle owner completing the full assessment flow" },
  { id: "dealerPersona", name: "Auto Dealer Evaluator", icon: "◆", color: "#D85A30", bg: "#FAECE7", description: "Independent dealer with service dept assessing fit" },
  { id: "trustCompliance", name: "Trust & Compliance Auditor", icon: "◇", color: "#7F77DD", bg: "#EEEDFE", description: "FTC disclosures, legal exposure, Tekmetric readiness" },
  { id: "featureGap", name: "Shop Adoption Strategist", icon: "◐", color: "#BA7517", bg: "#FAEEDA", description: "Feature gaps blocking 50+ shop partner scale" },
];

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "#A32D2D", bg: "#FCEBEB", dot: "#E24B4A" },
  warning: { label: "Warning", color: "#854F0B", bg: "#FAEEDA", dot: "#EF9F27" },
  info: { label: "Insight", color: "#185FA5", bg: "#E6F1FB", dot: "#378ADD" },
};

const IMPACT_CONFIG = {
  high: { label: "High Impact", color: "#0F6E56", bg: "#E1F5EE" },
  medium: { label: "Medium", color: "#854F0B", bg: "#FAEEDA" },
  low: { label: "Low", color: "#5F5E5A", bg: "#F1EFE8" },
};

export default function WrenchliAuditSuite() {
  const [agentStates, setAgentStates] = useState<Record<string, any>>({});
  const [pages, setPages] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const updateAgent = useCallback((id: string, update: any) => {
    setAgentStates(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...update } }));
  }, []);

  const deployAll = useCallback(async () => {
    setRunning(true);
    setError(null);
    setAgentStates({});
    setPages([]);
    setActiveAgent(null);

    AGENTS.forEach(a => updateAgent(a.id, { status: "running", result: null, error: null }));

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Audit failed");

      setPages(data.pages || []);
      setLastRun(data.scrapedAt);

      (data.agents || []).forEach(agent => {
        if (agent.result) {
          updateAgent(agent.id, { status: "done", result: agent.result, error: null });
        } else {
          updateAgent(agent.id, { status: "error", result: null, error: agent.error });
        }
      });
    } catch (err: any) {
      setError(err.message);
      AGENTS.forEach(a => updateAgent(a.id, { status: "idle" }));
    } finally {
      setRunning(false);
    }
  }, [updateAgent]);

  const doneAgents = Object.values(agentStates).filter(s => s?.status === "done");
  const allDone = doneAgents.length === AGENTS.length && !running;

  const allFindings = doneAgents.flatMap((s, i) => {
    const agentId = Object.keys(agentStates)[i];
    return (s?.result?.findings || []).map(f => ({
      ...f,
      agentId,
      agentName: AGENTS.find(a => a.id === agentId)?.name,
    }));
  });

  const allFeatures = doneAgents.flatMap((s, i) => {
    const agentId = Object.keys(agentStates)[i];
    return (s?.result?.featureRequests || []).map(f => ({
      ...f,
      agentId,
      agentName: AGENTS.find(a => a.id === agentId)?.name,
    }));
  });

  const criticalCount = allFindings.filter(f => f.severity === "critical").length;
  const highFeatures = allFeatures.filter(f => f.impact === "high");

  const avgScore = doneAgents.length
    ? Math.round(doneAgents.reduce((acc, s) => acc + (s.result?.score || 0), 0) / doneAgents.length)
    : null;

  const selected = activeAgent ? AGENTS.find(a => a.id === activeAgent) : null;
  const selectedState = activeAgent ? agentStates[activeAgent] : null;

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1.5rem 0", maxWidth: 920 }}>
      <h2 style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>Wrenchli Live Site Audit Suite</h2>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 2px" }}>
              Scrapes wrenchli.net live → runs 6 specialist agents in parallel
            </p>
            {lastRun && (
              <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>
                Last run: {new Date(lastRun).toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={deployAll}
            disabled={running}
            style={{
              background: running ? "var(--color-background-secondary)" : "#E07B39",
              color: running ? "var(--color-text-secondary)" : "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: running ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {running ? "Scraping & auditing…" : allDone ? "Re-run Audit" : "Run Live Audit"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#FCEBEB", borderRadius: "var(--border-radius-md)", fontSize: 13, color: "#791F1F" }}>
            {error}
          </div>
        )}
      </div>

      {pages.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>Pages scraped</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pages.map(p => (
              <span key={p.url} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 999,
                background: p.status === 200 ? "#EAF3DE" : "#FCEBEB",
                color: p.status === 200 ? "#3B6D11" : "#A32D2D",
              }}>
                {p.name} {p.status === 200 ? `· ${(p.contentLength / 1000).toFixed(1)}k` : `· ${p.status || "err"}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {allDone && avgScore !== null && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { label: "Overall score", value: `${avgScore}/100` },
            { label: "Critical issues", value: criticalCount, warn: criticalCount > 0 },
            { label: "Total findings", value: allFindings.length },
            { label: "Feature requests", value: allFeatures.length },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 14px" }}>
              <p style={{ fontSize: 12, color: warn ? "#A32D2D" : "var(--color-text-secondary)", margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: warn ? "#E24B4A" : "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: "1.5rem" }}>
        {AGENTS.map(agent => {
          const state = agentStates[agent.id];
          const status = state?.status || "idle";
          const isActive = activeAgent === agent.id;
          const criticals = (state?.result?.findings || []).filter(f => f.severity === "critical").length;
          const warnings = (state?.result?.findings || []).filter(f => f.severity === "warning").length;

          return (
            <div
              key={agent.id}
              onClick={() => state?.result && setActiveAgent(isActive ? null : agent.id)}
              style={{
                background: isActive ? agent.bg : "var(--color-background-primary)",
                border: `0.5px solid ${isActive ? agent.color : "var(--color-border-tertiary)"}`,
                borderRadius: "var(--border-radius-lg)",
                padding: "12px 14px",
                cursor: state?.result ? "pointer" : "default",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 15, color: agent.color }}>{agent.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: "var(--color-text-primary)" }}>{agent.name}</span>
                <span style={{
                  fontSize: 11, padding: "2px 7px", borderRadius: 999, flexShrink: 0,
                  background: status === "done" ? "#EAF3DE" : status === "running" ? "#FAEEDA" : status === "error" ? "#FCEBEB" : "var(--color-background-secondary)",
                  color: status === "done" ? "#3B6D11" : status === "running" ? "#854F0B" : status === "error" ? "#A32D2D" : "var(--color-text-tertiary)",
                }}>
                  {status === "done" ? `${state.result.score}/100` : status}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>{agent.description}</p>
              {state?.result && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {criticals > 0 && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#FCEBEB", color: "#A32D2D" }}>{criticals} critical</span>}
                  {warnings > 0 && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#FAEEDA", color: "#854F0B" }}>{warnings} warnings</span>}
                </div>
              )}
              {state?.error && <p style={{ fontSize: 11, color: "#A32D2D", margin: "4px 0 0" }}>{state.error.substring(0, 80)}</p>}
            </div>
          );
        })}
      </div>

      {selected && selectedState?.result && (
        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1.5rem", background: "var(--color-background-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18, color: selected.color }}>{selected.icon}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{selected.name}</p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>Score: {selectedState.result.score}/100</p>
            </div>
          </div>

          <div style={{ background: selected.bg, borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: 14, borderLeft: `3px solid ${selected.color}` }}>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 3px" }}>Top priority</p>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{selectedState.result.topPriority}</p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Findings</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {(selectedState.result.findings || []).map((f, i) => {
              const cfg = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.info;
              return (
                <div key={i} style={{ background: cfg.bg, borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>· {f.area}</span>
                  </div>
                  <p style={{ fontSize: 13, margin: "0 0 4px" }}>{f.issue}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>→ {f.recommendation}</p>
                </div>
              );
            })}
          </div>

          {(selectedState.result.featureRequests || []).length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Feature requests</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedState.result.featureRequests.map((fr, i) => {
                  const cfg = IMPACT_CONFIG[fr.impact] || IMPACT_CONFIG.low;
                  return (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: cfg.bg, color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.label}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{fr.feature}</p>
                        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{fr.rationale}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {allDone && highFeatures.length > 0 && (
        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>High-impact features — all agents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {highFeatures.map((fr, i) => {
              const agent = AGENTS.find(a => a.id === fr.agentId);
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <span style={{ fontSize: 15, color: agent?.color, flexShrink: 0 }}>{agent?.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{fr.feature}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 2px" }}>{fr.rationale}</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>from {fr.agentName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allDone && criticalCount > 0 && (
        <div style={{ border: "0.5px solid #F7C1C1", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", background: "#FCEBEB" }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px", color: "#791F1F" }}>Critical findings — action required</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allFindings.filter(f => f.severity === "critical").map((f, i) => {
              const agent = AGENTS.find(a => a.id === f.agentId);
              return (
                <div key={i} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: agent?.color }}>{agent?.icon}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{f.agentName} · {f.area}</span>
                  </div>
                  <p style={{ fontSize: 13, margin: "0 0 4px" }}>{f.issue}</p>
                  <p style={{ fontSize: 12, color: "#185FA5", margin: 0 }}>→ {f.recommendation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!allDone && !running && (
        <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--color-text-tertiary)", fontSize: 13 }}>
          Scrapes live wrenchli.net pages then runs 6 agents simultaneously — conversion, shop adoption, consumer experience, dealer fit, trust & compliance, feature gaps.
        </div>
      )}
    </div>
  );
}
