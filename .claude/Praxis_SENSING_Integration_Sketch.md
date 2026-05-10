# Praxis ↔ SENSING Integration Sketch

> **Type:** Integration sketch (not a Discovery doc)
> **Purpose:** Capture the corrected architectural framing for Praxis while it's fresh, so a future session can produce Praxis Discovery v2 from a known starting point rather than from yesterday's superseded design.
> **Drafted:** Sunday, May 10, 2026 (morning), in Chat
> **Drafted on partial knowledge:** SENSING read once via search snippets, not cover-to-cover. Full agent roster (46 agents) not yet read in detail. This sketch is the entry point to v2, not v2 itself.

---

## What this sketch is, and what it is not

This is **not** a Discovery document. It is a sketch produced specifically to preserve the architectural correction that emerged from the inventory exercise on 2026-05-10, before the cognitive context of the discovery is lost. The full Praxis Discovery v2 must be drafted in a fresh session that begins with the Constitutional Reference read (per the new rule in `wrenchli-ENGINEERING.md`).

This sketch captures three things only:

1. The corrected routing model
2. The questions that v2 will need to answer
3. What changes from v1 (the superseded doc) and what carries forward

It does not specify implementation details, cost models, build estimates, or open decisions. Those belong in v2.

---

## The corrected routing model

### What v1 said (incorrect)

```
External content → Praxis pipeline → Evren Matsuda (CLO)
                                   → Founder approval gate
                                   → Skill file updates
```

### What is actually correct

```
External content → Praxis pipeline → Astrid Vellholm (CSenO)
                                       ↓
                                   Solenne Marchetto (Horizon Scanner)
                                   Yusra Eldridge (Innovation Tracker)
                                       ↓
                                   Sensing classification (HIGH/MED/LOW)
                                       ↓
                                   Domain-specialist routing per
                                   the SENSING coordination map
                                       ↓ (only when patterns warrant)
                                   Evren Matsuda (skill file update input)
                                       ↓
                                   Founder approval gate
                                       ↓
                                   Mira Sokolov (skill file change execution)
```

The key correction: **Praxis is the ingestion infrastructure for the Sensing Layer.** It is not its own routing layer. SENSING already specifies how external signals get classified, routed, and surfaced. Praxis's job is to *be the input mechanism* for SENSING's existing horizon list and innovation tracking.

### Why this matters

The SENSING layer is already governed. It has:

- A defined Horizon List with five categories (regulatory, competitive, platform/vendor, industry signal, customer signal) and explicit critical alert thresholds per category
- A defined cadence (continuous critical / Tue-Fri daily brief / Monday weekly synthesis / monthly capability audit / monthly decision quality memo)
- A defined output format (critical alert / morning brief / weekly synthesis / capability audit memo / innovation brief / decision quality memo)
- A defined coordination map showing which signals route to which C-suite agent
- A defined "useful / not useful" feedback loop with calibration cadence
- A defined discipline rule that "Sensing surfaces; existing authority structure decides"

Yesterday's Praxis design tried to invent a parallel routing system. It would have created exactly the kind of architectural firewall violation that wrenchli-SENSING.md, wrenchli-CONSUMER_ADVISORS.md, and wrenchli-HEARTBEAT_OPERATIONS.md were specifically written to prevent. Praxis v1 would have been a sixth governance layer on top of the five that already exist.

Praxis as ingestion-infrastructure-for-SENSING is a much smaller architectural footprint and integrates cleanly with existing governance.

---

## What carries forward from v1

The technical pipeline described in v1 is substantively correct and survives the correction:

- **yt-dlp + FFmpeg + Whisper-via-Groq** for video ingestion
- **Web fetcher + content extractor** for article ingestion
- **pdfplumber + image extraction + OCR fallback** for PDF ingestion
- **Claude synthesis** producing structured markdown output
- **Tag-and-route** as an output stage

What changes is what the pipeline routes *to*. Instead of a custom "tag → wrenchli/baldwin/both" routing call, Praxis output feeds the existing SENSING classification mechanism. The routing call becomes simpler: it tags content against SENSING's existing five horizon categories rather than inventing new tags.

---

## What changes from v1

Six specific revisions for v2:

1. **Governance position.** Praxis is owned and operated by Baldwin (still correct). Praxis output flows into the Wrenchli SENSING layer through Astrid Vellholm (corrected — was: Evren Matsuda).

2. **Output classification.** Praxis output is tagged against SENSING's existing horizon categories (regulatory / competitive / platform-vendor / industry / customer) plus new categories TBD for content that falls outside the current horizon (corrected — was: tagged against ad-hoc Wrenchli skill domains).

3. **Cadence integration.** Praxis runs on a schedule that aligns with SENSING's existing brief cadence — content ingested overnight surfaces in the next morning's daily brief if it crosses the materiality threshold (corrected — was: independent cadence).

4. **Output format.** Praxis-synthesized content is formatted to be consumable by SENSING's existing brief templates rather than introducing a new output format (corrected — was: five-section canonical format).

5. **Bottleneck-prevention.** SENSING already has the brief format with built-in "useful / not useful" feedback. Praxis inherits this rather than designing its own review queue. Forge's anti-bottleneck requirement (when that pipeline is designed) will inherit the same SENSING-derived pattern.

6. **Founder approval scope.** SENSING surfaces; existing authority structure decides. Praxis as ingestion infrastructure does not introduce new founder approval requirements — it feeds existing ones. The Evren Matsuda tiered-approval question (currently in TASKS.md) becomes downstream of SENSING, not parallel to it.

---

## Open questions for v2

Questions to resolve when the full Discovery is drafted in the next session:

### Questions about SENSING integration

1. Does SENSING currently have an ingestion infrastructure, or does it rely on the founder manually surfacing signals? (If yes, Praxis replaces or augments that. If no, Praxis is net-new infrastructure.)
2. How does Astrid Vellholm currently watch the Horizon List in practice? What's her actual operating mechanism today?
3. What's the relationship between Praxis output and the existing morning briefing cron job (`morning-briefing-daily`, 11:00 UTC / 7am ET)? Does Praxis output feed that brief, or do they remain separate per the cadence coordination note in `wrenchli-SENSING.md`?
4. Does the SENSING horizon list need to be extended for Praxis-ingested content that falls outside the current five categories (founder education content, philosophy of agentic systems, AI tooling commentary, etc.)? Or should that content route to Baldwin only and not to Wrenchli at all?

### Questions about Baldwin's role

5. What does Baldwin actually do with the Praxis output that doesn't route to Wrenchli? Is Baldwin's vault its own structured library, or just an archive?
6. How does Baldwin avoid duplicating SENSING's work for Wrenchli-relevant content? Does Baldwin always defer to SENSING's classification, or does Baldwin do independent classification for personal-context purposes?
7. Where does the Forge content creation pipeline (still pending Discovery) fit into this picture? Forge presumably also feeds SENSING patterns when generating content — the same routing model applies in reverse.

### Questions about substrate

8. Where does Praxis run? The four-surface model (Chat / Code / Code-on-VPS / Cowork) suggests Code-on-VPS, but the SENSING integration question is "who can write to Wrenchli's morning-brief data store" which depends on the Lovable-vs-GitHub-vs-Claude architecture decision (also pending).
9. How does Praxis output get committed to the Wrenchli repo? This is the architecture question that connects to the Lovable/GitHub/Claude decision.

### Questions about scope

10. Is there a Wrenchli-internal version of Praxis (where the input is internal logs, agent outputs, decision-log entries) and a Wrenchli-external version (where the input is YouTube, articles, PDFs)? SENSING's design suggests two distinct ingestion classes, not one unified pipeline.

---

## What this sketch is NOT specifying

To prevent scope creep:

- **Implementation details** (tooling versions, infrastructure choices, cost models) — those belong in v2 Discovery
- **Build estimates** — those belong in v2 Planning
- **The Lovable/GitHub/Claude architecture decision** — that's a separate decision that informs v2
- **The Forge content pipeline integration** — Forge has its own pending Discovery
- **Any change to SENSING itself** — SENSING is canonical; Praxis integrates with it as-is unless a SENSING change is independently warranted

---

## Reading list for the v2 Discovery session

When the next session begins (probably next weekend), the first action — per the new Constitutional Reference Rule — is to read these in order before drafting v2:

1. `INSTALLED_SKILLS.md` (the registry)
2. `Wrenchli_Agent_Package_Rev4.md` or `.pdf` (the master roster)
3. `wrenchli-SENSING.md` (cover to cover, not via search snippets)
4. `wrenchli-OPERATIONS.md` (for the eight-step execution order and operating rhythm)
5. `wrenchli-DECISIONS.md` (for the tier framework and conflict routing)
6. `wrenchli-PEOPLE.md` (for Evren Matsuda's role definition and Sienna Kilmartin's authority)
7. `wrenchli-HEARTBEAT_OPERATIONS.md` (because Praxis may benefit from heartbeat-style scheduled execution)
8. This sketch
9. The superseded Praxis_Discovery.md (as historical context, not as input)

After that read, v2 Discovery can begin.

---

## A note on what this sketch demonstrates

This is the second time in 24 hours that an architectural correction has been caught by the inventory/verification discipline rather than by the design discipline. Yesterday: Cowork-as-substrate corrected to VPS-as-substrate. Today: Praxis-feeds-Evren corrected to Praxis-feeds-Astrid. Both corrections were caught by the founder asking verification questions, not by the design conversation flagging them itself.

The Constitutional Reference Rule (added to `wrenchli-ENGINEERING.md` 2026-05-10) is the engineering-discipline response to this pattern. The State Verification Rule (added 2026-05-09) is the operational-discipline response. Together they are a structural fix for the failure mode that produced both corrections.

---

*End of integration sketch.*
