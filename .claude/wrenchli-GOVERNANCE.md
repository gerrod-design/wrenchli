# Wrenchli Governance Skill
# This file governs corporate governance, board operations, decision rights, stakeholder obligations, D&O considerations, ESG posture, and governance-related escalation paths.
# Read this before responding to any prompt involving: board composition or operations, investor relations, fiduciary obligations, corporate formalities, decision-rights distribution, equity-holder communications, ESG commitments or reporting, governance document creation, or any strategic decision that implicates governance structure.
# Owned by: Founder (with General Counsel Evelyn Marchetti as primary advisor). Coordinated through Rhett Holloway (Chief of Staff) for board-facing operations.
# ============================================================

## Core Posture

Corporate governance for Wrenchli serves two purposes that are sometimes in tension. First, it protects the company — governance structures prevent founder mistakes, insider decisions that harm minority shareholders, operational chaos during transitions, and the legal exposures that come from neglecting corporate formalities. Second, governance enables scale — investors require governance infrastructure before writing meaningful checks, enterprise customers require governance posture before signing material contracts, and future liquidity (acquisition or IPO) requires governance documentation that has been clean from the beginning.

Governance is neither a bureaucratic burden to be minimized nor a prestige signal to be performed. It is the infrastructure that makes the company institutional rather than dependent on any single person. A company whose success requires specific people making specific decisions at specific moments is fragile. A company whose governance enables consistent good decisions regardless of who is in the room is scalable.

The operating principle: governance decisions are made in advance of when they are tested. By the time an investor asks to see the board consent log, or a regulator subpoenas corporate records, or a would-be acquirer does due diligence, the window for retrospective governance cleanup has closed. Every governance practice, every documentation discipline, every decision-rights boundary in this file exists to ensure Wrenchli's corporate structure supports scale rather than constrains it.

This skill operates alongside wrenchli-LEGAL.md (specific legal structure and contract framework), wrenchli-FINANCE.md (financial controls and investor relations), and wrenchli-CRISIS.md (crisis communications including board notifications during incidents). Together these files make Wrenchli's institutional infrastructure coherent.

---

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:

- Board composition, board operations, board meeting preparation, or board materials
- Investor communications, investor rights, investor reporting, or investor relations strategy
- Fiduciary duty considerations or decisions that implicate fiduciary obligations
- Corporate formalities (annual meetings, board consents, shareholder notices, corporate records)
- Equity holder communications or decisions affecting equity holders
- Governance document creation, review, or amendment (bylaws, stockholder agreements, board charters)
- ESG commitments, ESG reporting, or ESG-related investor or customer requests
- Director and officer (D&O) insurance, indemnification agreements, or director compensation
- Committee formation or committee operations (audit, compensation, nominating, etc.)
- Decision rights distribution between founder, board, and officers
- Governance-related legal advice or outside counsel engagement

When triggered, run the Governance Impact Check silently and present the output. Governance decisions often coordinate with Legal (wrenchli-LEGAL.md), Finance (wrenchli-FINANCE.md), and Regulatory (wrenchli-REGULATORY.md) — all applicable checks run and outputs are harmonized through the Decision Resolution Rubric in wrenchli-DECISIONS.md.

---

## Governance Impact Check Rule

Before any decision affecting governance, run the six-gate Governance Impact Check:

1. **Decision rights authority.** Who has authority to make this decision — founder, board, shareholders, specific officer? Reference the Decision Rights Matrix below to confirm.

2. **Fiduciary implications.** Does this decision create fiduciary exposure for directors or officers? Specifically, does it involve self-dealing, conflict of interest, corporate opportunity doctrine, duty of care, duty of loyalty, or business judgment rule considerations?

3. **Corporate formalities required.** What corporate formalities does this decision require — board consent, shareholder approval, committee recommendation, specific notice periods, documented resolutions?

4. **Stakeholder notification requirements.** Who must be notified before, during, or after this decision — all shareholders, specific investor classes, board members, regulators, employees, customers, partners?

5. **Documentation requirements.** What records must be created and preserved — minutes, consents, disclosures, certifications, filings, board packages? Where do these records live and who maintains them?

6. **Downstream governance implications.** Does this decision affect future governance structures — board expansion obligations, future shareholder rights, committee formation requirements, ESG reporting obligations?

Output format:

GOVERNANCE IMPACT CHECK:
Decision rights: [founder / board / shareholders / officer — cite specific authority]
Fiduciary implications: [none / describe specific concerns]
Corporate formalities required: [list specific formalities with deadlines]
Stakeholder notifications: [list specific parties and notification timing]
Documentation requirements: [list specific records with preservation requirements]
Downstream governance implications: [list forward-looking impacts]
Risk level: [low / medium / high / critical]
Recommended posture: [proceed / proceed with documentation / require formal process / defer / reject]

Critical-level findings stop the decision until proper governance process is followed. High-level findings require documented resolution of concerns before proceeding. Medium findings proceed with full documentation. Low findings proceed normally with standard record-keeping.

---

## Stage-Appropriate Governance Framework

Wrenchli's governance structure evolves through specific stages. Each stage has distinct appropriate practices. Over-governance at early stages creates friction; under-governance at later stages creates existential risk. The framework specifies what governance looks like at each stage.

### Pre-Seed Stage (Current — April 2026)

**Entity structure:** Delaware C-Corporation (confirmed per Wrenchli Project Context)

**Board composition:** Founder-only board is appropriate at this stage. Gerrod Parchmon as sole director. No outside directors required until first institutional investment.

**Decision-rights distribution:** Founder has full authority on all decisions except those reserved to shareholders under Delaware law. No officer appointments required beyond the founder holding necessary titles.

**Corporate formalities:** Minimal but non-negotiable:
- Annual shareholder meeting (even with sole shareholder, documented resolution required)
- Annual director meeting (sole director written consent in lieu of meeting)
- Board resolutions for material actions (major contracts, borrowings, equity issuances, acquisitions)
- Federal and Delaware annual filings
- Proper maintenance of corporate records in a recordbook (physical or digital)

**Documentation discipline:**
- All board consents in writing, signed, dated, filed
- Stock ledger maintained and current
- Cap table maintained in Carta or equivalent with audit trail
- Corporate bylaws on file and accessible
- Certificate of incorporation and any amendments on file

**Recommended external engagements:**
- Corporate counsel relationship (even if only for episodic advice)
- Accountant or CPA for tax compliance
- D&O insurance consideration defers to first outside capital

### Seed Stage (Activates with First Institutional Check)

**Board composition:** Transitions from founder-only to 2-3 members typically:
- Founder (retains control)
- Lead investor representative (if lead takes board seat)
- Potentially one independent director

**Decision-rights distribution:** Protective provisions typically introduced — certain material actions require investor approval or board approval rather than founder decision alone. These are negotiated at term sheet stage and documented in shareholder agreements.

**Typical seed-stage protective provisions:**
- Budget approval (annual operating plan)
- Officer compensation above thresholds
- Debt above thresholds
- Transactions with affiliates
- Sale of the company
- Additional equity issuances
- Material IP licensing or sale

**Corporate formalities additions:**
- Board meetings (quarterly minimum, more frequent during stage transitions)
- Formal board packages with agenda, financial update, key metrics, material decisions
- Board minutes professionally maintained
- Annual budget approval process
- Annual option pool management with board approval

**Required external engagements:**
- D&O insurance — policy in place before first outside director appointed, typical coverage $1M-$3M at seed stage
- Corporate counsel on retainer or relationship
- Board observer rights for investors who don't take seats
- Founder employment agreement with clear IP assignment

### Series A Stage

**Board composition:** Formal board structure with 5 members typical:
- 2 common directors (founder + one additional)
- 2 preferred directors (lead + one additional investor)
- 1 independent director (often industry veteran)

**Decision-rights distribution:** More formal protective provisions, often with Series A investor approval required on specific categories. Independent director matters in tie-breaking.

**Corporate formalities additions:**
- Compensation committee (typically board members with independent director chair)
- Audit committee consideration (often deferred to Series B)
- Annual 409A valuation for option strike prices
- Formal option grant approvals with board consent
- Material transaction disclosure to investors per their rights

**Required external engagements:**
- Tax counsel for transaction structure work
- Outside accountant or fractional CFO
- D&O insurance increased coverage, typically $5M-$10M
- Securities counsel for stock issuances and regulatory filings

### Series B and Later

**Board composition:** Expanded further, typically 7+ members with multiple independent directors, formal committees (audit, compensation, nominating/governance).

**Decision-rights distribution:** Board-level approval for material decisions. Founder retains operational control but board authority is real.

**Corporate formalities additions:**
- Audit committee (required for public companies, best practice earlier)
- Formal whistleblower process
- Ethics and compliance program
- Related-party transaction policy
- Director education and evaluation processes

**Required external engagements:**
- Auditors (often transition to Big 4 at Series B or C)
- Specialty counsel for specific transactions (M&A, IPO prep, international)
- D&O insurance coverage scales with company value, typically $10M+
- Governance consultants for board effectiveness review

### Growth Stage / Pre-IPO

**Board composition:** Fully formed board meeting public company standards:
- Majority independent directors
- Three required committees (audit, compensation, nominating/governance)
- Committee independence requirements
- Financial expert on audit committee
- Lead independent director or non-executive chair

**All public company governance practices in place:**
- Quarterly reporting to board
- Annual board self-evaluation
- Formal director compensation with equity component
- Code of business conduct and ethics
- Insider trading policy
- Regulation FD compliance preparation
- Sarbanes-Oxley readiness if IPO path

---

## Board Composition Architecture

Beyond stage-specific guidance, certain principles govern board composition regardless of stage:

**The Board Effectiveness Triangle.** Effective boards balance three perspectives:

*Investor representation* — investors need visibility and voice proportional to their economic stake. Preferred shareholders typically negotiate board seats in proportion to ownership. This is appropriate and expected.

*Operator expertise* — boards benefit from directors who have built or run companies at the stage Wrenchli is entering. A director who took a similar company from $5M ARR to $50M ARR is valuable because they've seen the specific inflection points ahead.

*Independent judgment* — boards function better with at least one director whose interests are neither aligned with a specific investor class nor operationally involved. Independent directors are tie-breakers, truth-tellers, and the check on both founder and investor incentives.

At Series A, Wrenchli should have all three represented. At growth stage, independent directors should constitute a majority.

**Director selection criteria.** When adding any director to the Wrenchli board:

- Specific expertise relevant to Wrenchli's current and next-stage challenges (automotive industry, marketplace dynamics, data licensing, consumer fintech)
- Track record of board effectiveness, not just operational success
- Temperament consistent with Wrenchli's culture (collaborative, direct, long-term-oriented)
- Time and attention to actually engage — a director who attends meetings but doesn't prepare or contribute is worse than an empty seat
- Reference checks from founders who've served with them (the critical reference is "would you serve on another board with this person")

**Avoid at all costs:**
- Directors who see board service as a prestige title rather than a responsibility
- Directors with portfolio companies that create material conflict of interest
- Directors whose primary motivation is sourcing for their own fund rather than serving Wrenchli
- Directors who can't attend meetings reliably or prepare substantively

**Board observer structure.** Investors who don't get board seats often negotiate observer rights. Observer rights should be:
- Explicitly non-voting
- Subject to confidentiality obligations equal to directors
- Revocable if the observer abuses the role
- Limited to substantive meetings (not every board committee)
- Documented with clear scope in investor rights agreement

---

## Decision Rights Matrix

The matrix below specifies who has authority for each category of decision at Wrenchli's current stage (pre-seed) and how the authority shifts at seed and Series A stages. This matrix is the operational application of the governance framework.

### Strategic Decisions

**Company mission and long-term strategy** — Founder authority at all stages. Board consultation at Series A+. Board approval not required but board buy-in is practically essential.

**Annual operating plan and budget** — Founder authority pre-seed. Board approval at seed+ (typical seed-stage protective provision).

**Material acquisitions or divestitures** — Founder authority pre-seed (with corporate formality documentation). Board approval at seed+.

**Sale of the company** — Shareholder approval required (Delaware law). Practically, board recommendation precedes shareholder vote.

**Entry into new strategic tracks (DNA expansion)** — Founder authority pre-seed with Strategy Check (wrenchli-STRATEGY.md). Board consultation at seed+. Board approval for expansion requiring material capital.

### Financial Decisions

**Routine operating expenditure** — Founder authority at all stages (subject to approval thresholds in FINANCE.md).

**Material contracts above thresholds** — Founder authority pre-seed. Board notification at seed, approval at Series A+.

**Debt issuance or major borrowings** — Founder authority pre-seed. Board approval at seed+ (typical protective provision).

**Equity issuances** — Shareholder approval for new authorizations. Board approval for option grants. Specific founder authority for grants within board-approved pools.

**Annual audited financials** — Board approval at Series A+.

### Personnel Decisions

**Founder compensation** — Board compensation committee at Series A+. Pre-seed, founder sets own compensation subject to 409A and tax considerations.

**Executive compensation** — Founder authority pre-seed. Board compensation committee at Series A+.

**Equity grants** — Board approval required for all grants (even pre-seed, via written consent).

**Hiring and termination of executives** — Founder authority with board notification at seed+. Board approval for CEO succession planning at Series A+.

### Governance Decisions

**Board composition changes** — Shareholder approval for director elections. Board approval for appointments between elections.

**Bylaws amendments** — Shareholder approval required.

**Certificate of incorporation amendments** — Shareholder approval required.

**Committee formation** — Board approval.

**D&O insurance procurement and renewal** — Board approval at seed+, founder authority pre-seed.

### Legal and Compliance

**Litigation initiation or material settlement** — Founder authority pre-seed with General Counsel (Evelyn Marchetti) coordination. Board approval at seed+ for material matters.

**Regulatory responses or settlements** — Founder authority with General Counsel and outside counsel coordination. Board notification at all stages for material matters. Board approval at Series A+ for settlements above thresholds.

**IP assignments or licensing** — Founder authority pre-seed. Board approval at seed+ for material transactions.

---

## Fiduciary Duty Framework

Directors and officers of Delaware corporations have specific fiduciary duties. Wrenchli's governance infrastructure ensures these duties are consistently met, not just theoretically acknowledged.

**Duty of Care.** Directors must act with the care an ordinarily prudent person would exercise. Practically, this means:
- Attending meetings and preparing substantively
- Reviewing material decisions with appropriate analysis
- Seeking expert advice when decisions involve specialized knowledge
- Documenting the reasoning behind material decisions
- Not relying on management representations without independent judgment on material matters

**Duty of Loyalty.** Directors must act in the best interests of the corporation, not their own interests or the interests of particular shareholders. Practically:
- Recusing from decisions where they have material personal interest
- Disclosing all conflicts of interest promptly and fully
- Not using board position for personal advantage (corporate opportunity doctrine)
- Not competing with the corporation
- Transactions with interested parties require specific procedural protections

**Good Faith.** Directors must act honestly and with the intent to serve the corporation's interests. Practically:
- Not acting knowingly against the corporation's interests
- Not intentionally failing to act when action is required
- Exercising judgment rather than rubber-stamping

**Business Judgment Rule.** When directors act with due care, loyalty, and good faith, their decisions receive substantial deference from courts even if those decisions turn out badly. The business judgment rule protects directors from hindsight-based liability. However, the rule does not apply to decisions tainted by self-interest, gross negligence, or bad faith.

**The operational discipline:** Every material board decision includes documented evidence that directors had the information they needed, took appropriate time to consider, sought relevant advice, and acted in the corporation's interest. This documentation is the practical implementation of fiduciary duty compliance.

---

## D&O Insurance and Indemnification Framework

Directors and officers face personal liability exposure for decisions made in their corporate capacity. D&O insurance and indemnification protect against this exposure. Without both, attracting and retaining quality directors becomes significantly harder.

**When to implement:**
- **Pre-seed:** Indemnification agreements with founder as sole officer/director are appropriate. D&O insurance is optional but cost-effective.
- **Seed stage:** D&O insurance is essential before first outside director joins. Standard coverage $1M-$3M for seed companies.
- **Series A+:** D&O coverage scales with company size, complexity, and risk profile. Coverage typically $5M-$10M at Series A, growing from there.

**Core components of D&O program:**

*Side A coverage* — protects directors personally when the company cannot indemnify (typically in bankruptcy or derivative lawsuits).

*Side B coverage* — reimburses the company for indemnification payments to directors and officers.

*Side C coverage* — covers the entity itself for securities claims.

*Employment Practices Liability (EPL)* — often bundled with D&O, covers employment-related claims.

*Fiduciary liability* — covers ERISA-related claims, relevant when Wrenchli adds retirement plans.

**Indemnification agreements:**
- Separate from insurance; contractual obligation from company to directors
- Should be as broad as Delaware law allows
- Should include advancement of expenses (not just reimbursement)
- Should survive termination of service
- Should cover both current directors/officers and former ones

**Procurement discipline:**
- Specialty broker relationship (not general commercial insurance)
- Annual coverage review with broker
- Claim history awareness — any claim, even one that doesn't result in loss, can affect future renewals
- Understand policy exclusions (intentional acts, prior claims, regulatory/criminal matters often excluded)

---

## ESG Posture Framework

Environmental, Social, and Governance (ESG) considerations matter increasingly for Wrenchli's operating environment. Enterprise customers request ESG disclosure during procurement. Institutional investors require ESG policy at Series A+. Regulatory developments (particularly EU CSRD, California SB-253) are making ESG reporting mandatory at scale.

Wrenchli's ESG posture is intentional, not performative. The commitments are limited to what Wrenchli can actually do and measure, and the reporting is honest about both achievement and gaps.

### Environmental Commitments

Wrenchli is a digital platform with minimal direct environmental footprint. The environmental commitments focus on:

**Platform-level footprint:**
- Hosting infrastructure chosen partly on renewable-energy profile (Vercel and Supabase both operate on predominantly renewable-energy infrastructure)
- API usage (Anthropic) contributes to energy footprint; monitor for material change in model efficiency over time
- Carbon accounting at the scale we can measure (API tokens and hosting are the primary sources)

**Industry contribution:**
- Wrenchli's assessment function may reduce unnecessary repairs and therefore waste generation — this is a positive environmental externality worth quantifying as data allows
- The Pro subscription's recall alert function helps consumers address safety-critical issues early, reducing both safety and environmental risk
- Programmatic SEO pages and content should not create unnecessary carbon footprint through excessive content generation without user value

**Transparency commitment:**
- Annual environmental impact disclosure starting Series A stage
- Methodology transparent, numbers honest (including gaps)

### Social Commitments

Social commitments focus on Wrenchli's treatment of consumers, partners, employees, and the communities Wrenchli operates in:

**Consumer protection:**
- Assessment always free (documented in SKILL.md)
- Privacy commitments (documented in SECURITY.md) — PII never sold, VIN protections
- Transparent AI disclosure
- No dark patterns in subscription or cancellation flows
- Accessibility commitment (WCAG 2.1 AA minimum)

**Partner fair dealing:**
- Free 90-day pilot for shop partners
- Transparent Verified Score methodology
- No hostage data at partner offboarding
- Honest exit interviews and data preservation

**Workforce treatment:**
- Fair contractor engagement per wrenchli-PEOPLE.md (forthcoming)
- Living wage commitment for W-2 employees when added
- Equity participation for all employees (when added)
- No retaliation against whistleblowers or good-faith dissent
- Diversity and inclusion in hiring (procedural discipline per PEOPLE.md)

**Community commitment:**
- Primary metros (Michigan, Ohio) specifically chosen partly on economic development rationale — jobs and consumer protection in markets that are underserved by coastal tech concentration
- Future scaling considers community impact, not just market size

### Governance Commitments

Governance ESG commitments are the practices documented throughout this skill file:

- Stage-appropriate board structure
- Fiduciary duty compliance framework
- Transparent financial reporting (per wrenchli-FINANCE.md)
- Ethical financial services partnership rules (APR ceiling, no predatory lending)
- Regulatory compliance posture (per wrenchli-REGULATORY.md)
- Security posture (per wrenchli-SECURITY.md)
- Accuracy discipline (per wrenchli-ACCURACY.md)

### ESG Reporting Cadence

- **Pre-seed:** Internal tracking only, not public
- **Seed stage:** Investor disclosure when requested
- **Series A+:** Annual ESG summary for investors
- **Growth stage:** Formal ESG reporting aligned with SASB standards for relevant industry
- **Pre-IPO:** Full ESG reporting per applicable regulatory requirements (SEC climate rules, EU CSRD if EU customers/investors, California SB-253 if California nexus)

### ESG Discipline

ESG commitments are subject to the Accuracy Discipline (wrenchli-ACCURACY.md). Every ESG claim made publicly must be sourced, verifiable, and honest about gaps. "Greenwashing" — unsupported environmental claims — creates specific regulatory exposure (FTC enforcement, EU CSRD penalties) and brand damage.

---

## Corporate Formalities Calendar

Certain governance activities occur on a regular cadence. Missing these creates legal exposure and, at later stages, investor concern. The calendar below is the standing rhythm:

**Annual:**
- Annual shareholder meeting (even with sole shareholder pre-seed)
- Annual director meeting or action by written consent
- Annual option pool allocation review (when equity plan exists)
- 409A valuation (when options being granted)
- Delaware franchise tax filing (due March 1)
- Federal tax return (due per entity type)
- State tax returns in all states where Wrenchli has nexus
- D&O insurance renewal (when policy in place)
- Corporate counsel engagement review
- ESG summary preparation (Series A+)

**Quarterly (Seed stage+):**
- Board meeting
- Financial update to investors per investor rights agreement
- Material matters summary to board
- Key metrics reporting

**As-triggered:**
- Material contract board notifications/approvals
- Equity issuance board approvals
- Transaction notifications to investors with specific rights
- Regulatory filings as required
- D&O policy claim reporting if applicable

**Record-keeping cadence:**
- Board consents filed within 30 days of execution
- Annual financial statements prepared within 60 days of year-end
- Stock ledger updated within 10 days of any transfer or issuance
- Cap table reconciliation monthly

---

## Investor Relations Framework

Investor relations is governance-adjacent and requires specific discipline. The framework below establishes how Wrenchli communicates with investors at each stage.

### Pre-Investment

Before taking any institutional investment, founders should understand the ongoing obligations that come with the check:

- **Reporting obligations:** What will the investor expect in reports, cadence, format?
- **Consent rights:** What decisions will require investor approval going forward?
- **Information rights:** What access will investors have to books, records, and officers?
- **Pre-emptive rights:** Can investors participate in future rounds?
- **Tag-along and drag-along rights:** How do these affect future liquidity options?
- **Registration rights:** When does the investor's right to register their shares activate?
- **Board and observer rights:** Who gets seats or observation?

These terms are negotiated at term sheet stage and documented in the shareholder agreement. The founder's future operational flexibility depends heavily on how these are negotiated.

### Ongoing Investor Communication

Once investors are on the cap table, communication discipline becomes essential:

**Regular reporting cadence:**
- Monthly update email to all investors (seed stage)
- Quarterly board package with financials, metrics, material matters (Series A+)
- Annual letter to all shareholders with year in review

**Material matter disclosure:**
- Material contracts signed
- Executive departures or hires
- Significant customer wins or losses
- Product or strategy shifts
- Legal or regulatory matters
- Cybersecurity incidents (coordinated with wrenchli-SECURITY.md incident response)

**Information discipline:**
- Consistent information to all investors in the same class (no selective disclosure)
- Privileged information handled appropriately (material non-public information requires insider trading awareness at later stages)
- Investor questions answered promptly and substantively
- Bad news delivered clearly and proactively, not buried or delayed

**The operational rule:** Investors who hear important news from other sources first — press, competitors, employees — lose confidence in the founder. Bad news travels faster internally than externally, giving founders a window to shape investor interpretation. Using that window well is an operational discipline worth maintaining.

### VC Intelligence Coordination

Declan Morrissey (VC Intelligence Agent) supports investor relations by:
- Tracking active VCs in relevant spaces (automotive tech, consumer fintech, marketplace, vertical AI)
- Monitoring comparable company valuations and funding environment
- Preparing briefing materials before investor meetings
- Maintaining VC relationship history (who's been contacted, what was discussed, outcome)
- Flagging VCs whose portfolio/thesis creates specific fit with Wrenchli

Declan reports to Darya Nazari (CFO). His work informs both investor outreach and investor communication strategy.

---

## Crisis Governance

When material crises occur — security incidents, regulatory actions, executive departures, legal actions — governance plays a specific role in the response. This section coordinates with wrenchli-CRISIS.md (Round 10) for the broader crisis response framework.

**Board notification obligations during crises:**

- **Security incidents affecting Tier 1 data:** Board notification within 24 hours of confirmed scope
- **Regulatory enforcement actions:** Board notification within 48 hours of receipt
- **Material legal actions:** Board notification upon filing or service
- **Executive departures (C-suite):** Board notification immediately upon decision
- **Material customer loss (above defined threshold):** Board notification in next regular communication
- **Material financial anomalies:** Board notification immediately upon detection

**Emergency board meetings:**

Certain crises require emergency board convening rather than waiting for regular cadence:
- Company-threatening security incident
- Regulatory enforcement with existential implications
- Material acquisition or sale discussions
- CEO incapacitation
- Material fraud or misconduct discovery

Emergency meetings can be held by telephone or video with shortened notice per bylaws. Minutes should be especially complete for emergency meeting decisions.

**Disclosure discipline during crises:**

- No material crisis information disclosed to any third party before board notification
- Material non-public information shared with board creates insider trading considerations (relevant at later stages)
- Crisis response decisions documented even when made rapidly
- Post-crisis retrospective conducted with board for learning purposes

---

## Integration With Existing Skills

**The full execution order** (now spanning governance, legal, regulatory, security, accuracy considerations):

1. Strategy skill (wrenchli-STRATEGY.md) — is the right problem being solved
2. Operations skill (wrenchli-OPERATIONS.md) — how should it be operationalized
3. CEO Check (in wrenchli-SKILL.md) — does it pass revenue/retention/acquisition filters
4. Engineering Check (in wrenchli-SKILL.md) — is the technical architecture safe
5. Accuracy Check (wrenchli-ACCURACY.md) — are factual claims verified
6. Security Check (wrenchli-SECURITY.md) — does it preserve security posture
7. Regulatory Check (wrenchli-REGULATORY.md) — does it preserve regulatory compliance
8. **Governance Check (this skill) — does it preserve governance integrity**
9. Brand/Marketing compliance per wrenchli-SKILL.md and wrenchli-MARKETING.md

Governance sits in the execution order because many decisions that pass security, regulatory, and accuracy checks still implicate governance — board-approval requirements, shareholder disclosure obligations, fiduciary duty considerations. Governance is the check that asks "can the founder even make this decision alone, or does this require a process?"

Some decisions trigger governance primarily. Investor communications, board material preparation, equity issuances, major contract approvals, and bylaw amendments are primarily governance decisions where governance is the lead skill.

---

## Escalation Path

Governance decisions escalate through the three-tier structure specified in wrenchli-OPERATIONS.md:

**Tier 1 — Agent-level resolution.** Routine governance matters (annual filings, quarterly reporting preparation, standard board package preparation) handled by Rhett Holloway coordinating with Evelyn Marchetti.

**Tier 2 — C-suite escalation.** Substantive governance matters (board composition changes, new investor rights negotiations, fiduciary duty questions, committee formation) escalate to Evelyn Marchetti (General Counsel) with founder coordination.

**Tier 3 — Founder escalation.** The following always reach the founder:
- Any decision requiring board approval or shareholder approval
- Any fiduciary duty question with material exposure
- Any disagreement with investors on governance matters
- Any executive departure or succession decision
- Any material governance document amendment
- Any crisis requiring emergency board convening
- Any decision about when to raise capital or how to structure funding

Additionally, some governance decisions require board decision rather than founder decision. The Decision Rights Matrix above specifies which. Founder cannot override board authority on decisions the board is required to approve under Delaware law or the company's governance documents.

---

## Closing Principle

Governance is the infrastructure that makes Wrenchli institutional. A founder can build a product, acquire customers, and generate revenue without formal governance structures. That founder cannot scale past certain stages without them. Investors won't write institutional checks, enterprise customers won't sign material contracts, acquirers won't conduct due diligence, and markets won't value the business fairly without governance infrastructure that demonstrates the company is built to last beyond its founder.

This skill exists because the governance decisions most likely to be neglected are the ones that matter most in retrospect. A missed annual meeting, a board decision made without proper documentation, a disclosure obligation quietly missed — none of these are visible until they are. At which point the damage is already done.

The principle that governs this skill: *Build the governance infrastructure ahead of when it is tested. Document decisions as if they will be audited. Treat corporate formalities as table stakes, not bureaucracy. The founder's ability to make good decisions consistently depends on the structure around those decisions being consistently sound.*
