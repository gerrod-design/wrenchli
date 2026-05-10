# Praxis — Discovery Document

> **⚠️ STATUS: SUPERSEDED — 2026-05-10**
>
> This document was drafted on 2026-05-09 without having read `wrenchli-SENSING.md`, an installed skill file that defines the Sensing Layer (Astrid Vellholm, Chief Sensing Officer) as the existing infrastructure for proactive external signal ingestion and routing.
>
> The governance position in this document — that Praxis output flows to Evren Matsuda (Chief Learning Officer) — is incorrect. The architecturally correct consumer of Praxis output is Astrid Vellholm's Sensing Layer, specifically Solenne Marchetto (Horizon Scanner) for content matching the existing horizon list, and Yusra Eldridge (Innovation Tracker) for tooling and capability signals. Evren Matsuda receives input from Sensing only when patterns suggest skill file updates are warranted — Evren is downstream of Astrid, not parallel to her.
>
> The technical pipeline described in this document (yt-dlp + FFmpeg + Whisper for video; readers for articles and PDFs; Claude synthesis + tagging + routing) remains substantively correct. What needs revision is how Praxis's output integrates with the existing Sensing infrastructure, the cadence model (which should align with SENSING's existing Tue-Fri daily / Monday synthesis pattern), and the routing logic (which should map to the SENSING coordination map).
>
> See `Praxis_SENSING_Integration_Sketch.md` (2026-05-10) for the corrected framing and the questions that remain open for v2.
>
> A full Praxis Discovery v2 will be drafted in a future session after a complete Constitutional Reference read of `INSTALLED_SKILLS.md`, the Wrenchli Agent Package Rev 4, `wrenchli-SENSING.md`, `wrenchli-OPERATIONS.md`, and `wrenchli-DECISIONS.md`.
>
> **Do not act on this document as written.** It is preserved as the historical record of an architectural error caught by the inventory exercise on 2026-05-10.

---

> **Status:** Discovery (Assembly Line stage 1 of 3) · **Date:** 2026-05-09
> **Next stage:** Planning session (recommended: weekend, fresh session)
> **Related files:** [wrenchli-PEOPLE.md](wrenchli-PEOPLE.md) · [wrenchli-ACCURACY.md](wrenchli-ACCURACY.md) · [wrenchli-ENGINEERING.md](wrenchli-ENGINEERING.md)

---

## Purpose

Praxis is the **proactive external learning pipeline** for the Wrenchli agent team and the Baldwin personal operating system. It ingests external content — videos (YouTube lectures, podcasts, industry talks, founder interviews, regulatory webinars), articles (industry analyst pieces, founder essays, news), and PDFs (analyst reports, regulatory documents, research papers) — and produces structured markdown records that compound the institutional knowledge of both systems.

Today this work happens manually: the founder pastes URLs or uploads documents into NotebookLM, runs a "report" generation, copies the output to a Google Doc, and uploads the Doc to the Wrenchli project. This process has three failure modes:

1. **Visual content is invisible.** NotebookLM works primarily from text transcripts. Slides, diagrams, on-screen code, charts in PDFs, and visual references that aren't described verbally or in body text are not captured.
2. **Synthesis is editorial, not faithful.** NotebookLM's report feature produces an interpretive summary, not a faithful record. Anything the model considers tangential — including content that would be valuable to a downstream agent with different priorities — is dropped.
3. **The process consumes founder time at scale.** At daily ingestion frequency across a balanced mix of video, articles, and PDFs, this is roughly 15–20 minutes per item, or 10–15 hours per month, of work that should be delegated to a pipeline.

Praxis replaces this manual process with an automated pipeline that handles all three content types through a unified architecture, captures both textual and visual content, produces a structured canonical record per item, and routes the output to the appropriate institutional consumer.

---

## Governance Position

**Praxis is owned and operated by Baldwin (the personal operating system).** It does not run inside the Wrenchli infrastructure and does not consume Wrenchli engineering resources. Baldwin's substrate is Claude Code hosted on a VPS — selected over Cowork desktop because Praxis requires always-on, schedule-driven, mobile-controllable operation independent of the founder's laptop being open. Cowork is used for desk-side Baldwin tasks only, not for Praxis.

**Praxis output flows into Wrenchli through Evren Matsuda (Chief Learning Officer) as a governed input to the existing institutional learning function.** This is not a new agent role and does not require an addition to the Wrenchli agent roster. Evren's role in `wrenchli-PEOPLE.md` already establishes:

- Ownership of the quarterly skill file update cadence
- Authority to identify skill files that need revision based on emerging risks or changed external conditions
- Maintenance of the institutional learning log

What Praxis adds to the existing function is a **new input source**: until now, Evren's learning inputs have been internal (security incidents, regulatory actions, agent errors caught by Imani Whitfield, decision-pattern reviews from Mira). Praxis provides the proactive external learning input that the CLO function needs in order to keep the agent team current on industry developments rather than purely reactive to internal events.

The constraint that **all skill file updates go through the founder for approval** is preserved unchanged. Praxis can recommend updates; Evren can synthesize and route them; the founder approves before any skill file changes.

**Baldwin consumes Praxis output independently for personal-knowledge purposes** (founder briefings, personal research, conversation context). Baldwin's consumption is unrelated to Wrenchli's institutional learning loop.

---

## Architecture

### Two-stage architecture: trigger → intake handler → processing core

Praxis is structured in two stages. The **trigger stage** is how a piece of content gets queued. The **intake stage** is type-aware: a router selects the right handler based on content type (video, article, PDF). The **processing core** is identical regardless of source type — Claude synthesis, routing, tagging, and output writing all run the same way.

This separation is the central architectural decision. It means new content types can be added in v1.5 or v2 by writing a new intake handler without touching the processing core. It also means the routing rubric and output format are uniform across all content types, which is what allows downstream consumers (Evren Matsuda, Baldwin) to query the vault as a single library rather than three separate libraries.

### Trigger mechanisms (three, all feeding the same queue)

Praxis supports three trigger mechanisms that feed a single queue:

**1. Reactive trigger (paste a URL or drop a file).** A single endpoint or shortcut that accepts a YouTube URL, an article URL, or a PDF upload and queues the item for immediate processing. Use case: founder hears about a talk, finds a relevant article, or receives a PDF report and wants it ingested by end of day. Latency target: under 10 minutes from trigger to file delivery.

**2. Batch trigger (URL/file list watcher).** A monitored list (Google Sheet, text file, or Notion database) that accumulates URLs and file references throughout the day. The pipeline processes the batch nightly during off-peak hours. Use case: items collected during normal browsing accumulate without interrupting work; the batch processes them overnight.

**3. Subscription trigger (channel/feed/watcher list).** A list of trusted sources the pipeline monitors automatically: YouTube channels and playlists for video, RSS feeds and newsletter inboxes for articles, watched folders or shared Drive locations for PDFs. New items are processed without any founder action. Use case: trusted sources (Karpathy, YC, AI All-In, specific industry analysts, regulatory agency newsletters) feed the pipeline continuously.

All three trigger mechanisms feed the same queue, which is then drained by the intake stage.

### Intake handlers (three, one per content type)

When an item reaches the intake stage, a router inspects it and dispatches to the appropriate handler:

**Video handler.**
1. `yt-dlp` retrieves the video file from the URL.
2. `FFmpeg` extracts visual frames at regular intervals (default cap: 100 frames per video, regardless of length).
3. `Whisper via Groq` produces a timestamped transcript of the audio.
4. Output: frames + timestamped transcript, handed off to the processing core.

**Article handler.**
1. Fetcher retrieves the article HTML, handling paywalls, JavaScript-rendered content, and dynamic loading where possible. Specific tooling (Playwright, Readability, Mercury Parser, or a custom extractor) is a Planning decision.
2. Content extractor separates article body from navigation, ads, and related-content blocks.
3. Metadata extractor pulls title, author, publication, publish date, canonical URL.
4. Visual asset extractor pulls embedded images and chart references.
5. Output: clean article text + metadata + visual asset references, handed off to the processing core.

**PDF handler.**
1. Text extractor (pdfplumber for layout-aware extraction, pdftotext as fallback) pulls the document text.
2. Image/figure extractor (pdfimages, optionally pdftoppm for full-page rasterization) pulls visual content.
3. OCR fallback (pytesseract or equivalent) handles scanned documents where text extraction fails.
4. Metadata extractor pulls title, author, page count, publish date if present.
5. Output: full text + extracted figures + metadata, handed off to the processing core.

The PDF handler reuses the read-only patterns from the standard pdf-reading skill at `/mnt/skills/public/pdf-reading/SKILL.md`. No new PDF tooling needs to be invented; the handler is mostly orchestration.

### Processing core (identical for all content types)

Once an intake handler has produced its output, the processing core runs identically:

1. **Synthesize** — Claude receives the type-appropriate inputs (frames + transcript, or article text + visuals, or PDF text + figures) and produces a structured markdown output (format below).
2. **Tag** — A second Claude call evaluates the synthesized output against a routing rubric (which Wrenchli skill domains it touches, whether it is Baldwin-relevant, whether it is both) and writes the file to the appropriate destination(s).

This is a streaming pipeline, not a batch transformer. Each item is processed independently end-to-end.

### Canonical output format

Every Praxis output is a single markdown file with this structure, top to bottom. The structure is uniform across all content types so downstream consumers query a single library, not three.

**1. Header block**
- Title (from source metadata)
- Source URL or filename
- Source type (`video` / `article` / `pdf`)
- Publisher / channel / author
- Duration (video) or page count (PDF) or word count (article)
- Ingestion date
- Tags (`wrenchli`, `baldwin`, `both`) and Wrenchli skill domain tags (`engineering`, `marketing`, `compliance`, `regulatory`, `strategy`, `commercial`, `legal`, `finance`, `accuracy`, `security`, `operations`, `people`, `decisions`, `crisis`, `governance`, `consumer-advisors`, `heartbeat`, `fundraising`)
- One-paragraph executive summary

**2. Synthesis**
- Claude's interpretive write-up of the key ideas, calibrated in length to the content's substance
- Length is determined by content density, not source length: a 5-minute insight-dense talk or a 2-page memo may produce a longer synthesis than a 90-minute interview or a 50-page report with little signal

**3. Visual content analysis**
- For video: frame-by-frame highlights of slides, code, charts, on-screen UI, and visual content the speaker referenced but did not read aloud, cross-referenced to transcript timestamps
- For PDFs: figure, chart, and diagram analysis with page references
- For articles: embedded image and visual asset descriptions with positional references
- Section is omitted when the source has no meaningful visual content (e.g., a text-only article)

**4. Full content**
- For video: timestamped transcript, verbatim
- For articles: full article text, verbatim
- For PDFs: full extracted text, with page boundaries preserved

**5. Tagged concepts**
- Extracted entities, frameworks, and references for cross-linking
- Format: simple list, suitable for downstream parsing

This is one file per item, written once, used by everything downstream. The header and synthesis are what humans read; the rest is what agents query.

### Output routing

Each file is written to one or more destinations based on the tags assigned by the routing call:

| Tag combination | Destinations |
|---|---|
| `baldwin` only | Baldwin vault (path TBD in Planning) |
| `wrenchli` only | Wrenchli project (`/mnt/project/praxis/`) |
| `both` | Both destinations |

The routing call evaluates each item against a short rubric:
- Is the content directly relevant to a Wrenchli skill domain or strategic question? → `wrenchli`
- Is the content relevant to general personal-assistance knowledge or founder-context briefings? → `baldwin`
- Both? → `both`
- Neither? → reject (the file is not written; the item is logged as ingested-but-discarded)

The rejection path is important. Not every item the founder ingests should enter the institutional record; some are entertainment, some are exploratory, some turn out to be lower-quality than expected. The routing call provides the filter.

---

## Integration With Evren Matsuda's CLO Function

Praxis output tagged `wrenchli` lands in `/mnt/project/praxis/`. Evren Matsuda reviews this directory on a defined cadence (proposed: weekly, alongside existing CLO duties) and produces:

1. **Routing recommendations.** For each Praxis file, which Wrenchli skill files (if any) should be reviewed for potential update in light of the new content? This is a recommendation list, not a change set.
2. **Founder briefings.** When a Praxis file contains material that warrants founder attention before quarterly review (significant external development, regulatory shift, competitive intelligence), Evren flags it via Rhett Holloway's existing briefing mechanism.
3. **Quarterly skill file update inputs.** Praxis output accumulated across the quarter feeds Evren's quarterly skill file update cadence as one input source alongside the existing internal sources.

Evren does not modify skill files based on Praxis output. The existing constraint — *all skill file updates go through the founder for approval* — is preserved. Praxis is an input source; the existing governance loop is unchanged.

---

## What Praxis Is Not

To prevent scope creep, the following are explicitly out of scope:

- **Praxis does not produce consumer-facing content.** It is an internal learning pipeline. Synthesis outputs are not edited and republished as Wrenchli blog content or marketing material.
- **Praxis does not modify Wrenchli skill files.** That authority rests with the founder, mediated by Evren Matsuda, per the existing constraint in `wrenchli-PEOPLE.md`. Praxis recommends; humans decide. (Note: a separate TASKS.md item considers evolving this rule to a tiered approval framework given Praxis's expected ingestion volume. Praxis will operate within whatever rule is in effect when it ships.)
- **Praxis does not ingest content types beyond video, articles, and PDFs in v1.** Email threads, audio-only podcasts (without video), Slack/Discord conversations, and live transcripts are out of scope for v1. They may be added through additional intake handlers in v1.5 or v2 without changes to the processing core.
- **Praxis does not run inside Wrenchli infrastructure.** It is Baldwin-owned and operated. Wrenchli reads its outputs but does not host its compute.
- **Praxis is not a Wrenchli product feature.** A separate future build (Round 16+, "Wrenchli Video Symptom Capture") may apply the same technical pattern to consumer-submitted vehicle video. That is a different system with different governance and is not connected to Praxis at the architectural level.

---

## Cost Profile

Per-item processing cost (estimated, to be validated in Planning):

**Video items:**
- yt-dlp: free
- FFmpeg: free (local compute)
- Whisper via Groq: ~$0.10–0.30 per hour of video transcribed
- Claude synthesis call: ~$0.50–1.50 per video depending on length and frame count
- Claude routing call: ~$0.05–0.10 per video
- Subtotal: approximately $1–3 per video

**Article items:**
- Web fetcher: free (or low-cost if a paid extraction service is needed for paywalled content)
- Claude synthesis call: ~$0.10–0.40 per article depending on length
- Claude routing call: ~$0.05–0.10 per article
- Subtotal: approximately $0.20–0.60 per article

**PDF items:**
- pdfplumber, pdfimages, pytesseract: free (local compute)
- Claude synthesis call: ~$0.20–1.00 per PDF depending on length and figure count
- Claude routing call: ~$0.05–0.10 per PDF
- Subtotal: approximately $0.30–1.20 per PDF

**Estimated monthly spend at daily ingestion across a balanced mix** (roughly one video, one article, one PDF per day):
- Low end: ~$50/month
- High end: ~$150/month

Compared against the founder time currently spent on manual NotebookLM-based ingestion (estimated 10–15 hours per month at the daily-ingestion cadence), the pipeline pays for itself at any reasonable hourly valuation of founder time.

The existing Financial Hard Stops principle from `wrenchli-ENGINEERING.md` applies: budget caps must be set at the provider level (Groq, Anthropic) before the pipeline goes live, regardless of expected spend.

---

## Build Estimate

The full build, executed as a proper Assembly Line:

- **Discovery session** — this document. Complete.
- **Planning session** — produce technical roadmap, infrastructure decisions, security/credentials handling, specific component versions for all three intake handlers, the routing rubric prompt, and explicit Done criteria. Estimated effort: 2–3 hours.
- **Execution session** — build the pipeline against the plan. Estimated effort: 8–12 hours, distributed across the trigger layer, three intake handlers, and the processing core.

Total build effort: approximately 12–18 hours of focused work, distributed across at least two distinct sessions per the Assembly Line Session Model in `wrenchli-ENGINEERING.md`.

The recommendation is to run Planning and Execution across a focused weekend: Planning on Saturday morning, Execution distributed across Saturday afternoon and Sunday. The video handler should be built first (its components are most battle-tested), then the PDF handler (mostly orchestration of existing pdf-reading skill patterns), then the article handler (highest variability and edge-case complexity).

A v1 ship-ordering note: it is acceptable to ship the pipeline with the video handler working first and the article and PDF handlers following within days of v1 launch, as long as the architectural separation between trigger, intake, and processing core is built correctly from day one. This avoids forcing a single weekend to produce all three handlers at production quality while preserving the unified architecture that prevents v2 rework.

---

## Open Decisions for the Planning Session

The following were intentionally deferred from Discovery to Planning:

1. **Where does Baldwin's vault live?** Filesystem path on the VPS. Folder structure. Backup posture. (Sloane Ashford's principles apply even though Praxis is Baldwin-owned, since the vault contains material that may include personal sensitive context.)
2. **Where does the URL/file batch list live?** Google Sheet, Notion database, simple text file, watched folder, or some combination. Tradeoff: ease of input vs. integration complexity. May differ by content type (URLs in a sheet, PDFs in a watched folder).
3. **What sources go in the subscription list at launch?** A starting roster of trusted sources across all three content types — YouTube channels/playlists, RSS feeds, newsletter inboxes, watched Drive folders — with the understanding that the list evolves over time.
4. **What is the exact routing rubric prompt?** This is the single most important prompt in the pipeline because it determines what reaches Wrenchli. It deserves dedicated drafting in Planning. The prompt must work uniformly across all three content types.
5. **Article handler tooling.** Specific choice of fetcher (Playwright, Puppeteer, simple HTTP), content extractor (Readability, Mercury, custom), and paywall handling strategy. Highest variability of the three handlers; warrants the most Planning attention.
6. **PDF handler edge cases.** Behavior when text extraction fails (scan with OCR or rasterize-and-vision?), behavior on encrypted/password-protected PDFs (reject or queue for manual handling?), behavior on PDFs with embedded files (extract or skip?).
7. **What is the failure / retry behavior?** Per content type. What happens when yt-dlp fails (private video, region-locked, age-restricted)? When a fetcher hits a paywall it can't get past? When a PDF is malformed or corrupted? Each failure mode needs a defined behavior.
8. **What is the observability posture?** How does the founder know the pipeline ran, what it ingested, and whether anything failed silently? This connects to Lorenzo Bianchi's existing operational monitoring patterns even though Praxis is Baldwin-owned.
9. **What is the security posture for credentials?** Groq API keys, Anthropic API keys, YouTube API keys (if any), any paid extraction service keys. The principle from `wrenchli-ENGINEERING.md` applies: no credentials in code; environment variables only; provider-level budget caps.
10. **Ship ordering.** Video handler first, then PDF, then article — or all three at v1 launch? Tradeoff: faster initial value vs. uniform v1 capability.

These decisions belong in Planning, not Discovery. Attempting to resolve them now would inflate the Discovery scope and produce worse decisions because they require dedicated attention rather than tail-end consideration.

---

## What Tonight Validated

This Discovery process produced three substantive corrections to the original framing:

**Correction 1 — Governance position.**

*Original framing:* "Praxis is a Baldwin task, not a Wrenchli task. Adding it to Wrenchli would be scope creep."

*Corrected framing:* "Praxis is built and operated by Baldwin. Praxis output flows into Wrenchli through Evren Matsuda as a governed input to the existing CLO function. The build is Baldwin's; the institutional consumption is Wrenchli's, governed by existing roles and rules."

The correction matters because it identifies that Praxis is not a new agent, not a new role, and not a new governance loop. It is a new *input source* to a function that has been waiting for this input mechanism since Evren Matsuda was defined. The architectural firewall is preserved, the agent roster is unchanged, and the founder approval gate on skill file updates is unchanged (with a separate TASKS.md item considering whether that gate should evolve to a tiered model given Praxis's expected ingestion volume).

**Correction 2 — Content scope.**

*Original framing:* "Praxis v1 ingests video only. Articles and PDFs are out of scope until v2."

*Corrected framing:* "Praxis v1 ingests video, articles, and PDFs through a unified architecture. Type-aware intake handlers feed a single processing core, allowing additional content types to be added in v1.5 or v2 by writing new handlers without touching the core."

The correction matters because the original scope solved roughly a third of the founder's actual ingestion problem and would have left manual NotebookLM running for the rest. The unified architecture is moderately more expensive to build (12–18 hours instead of 6–10) but solves the actual problem and avoids a v2 rebuild. The cost increase is proportional to the value increase.

**Correction 3 — Substrate (added 2026-05-09 afternoon).**

*Original framing:* "Praxis runs inside Claude Cowork on the founder's desktop, alongside Baldwin's other operations."

*Corrected framing:* "Praxis runs on Claude Code hosted on a VPS, as part of Baldwin's always-on substrate. Cowork remains in scope for desk-side tasks only, not for scheduled or always-on operations."

The correction matters because Cowork's design requires the desktop app to remain open and the computer to be awake. For scheduled nightly ingestion, mobile-controllable operations, and 24/7 availability, this is the wrong substrate. A VPS-hosted Claude Code instance with tmux session persistence runs independently of the founder's hardware and is reachable from any device. Cost: ~$5–10/month VPS plus ~90 minutes of additional setup work in the build session. Benefit: the substrate actually meets Baldwin's always-on requirement.

All three corrections came from the founder pressure-testing the Discovery doc rather than accepting it as drafted. This is the discipline of Discovery review working as intended — not just "what do we build," but "is this the right shape for the build, and does it match the actual problem?"

---

## Recommended Next Action

After this document is reviewed and approved:

1. Save this Discovery doc to `/mnt/project/Praxis_Discovery.md` as the canonical record.
2. Add a one-line entry to `TASKS.md` under "This Month": *"Praxis Planning + Execution sessions — proactive external learning pipeline. Discovery complete 2026-05-09."*
3. Move directly to **Track 2 (financial services build)** with the Discovery doc closed out and Praxis on a clean schedule for the weekend.

---

*End of Discovery document.*
