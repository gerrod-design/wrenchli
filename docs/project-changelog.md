# Wrenchli — Project Decisions & Changelog

> Generated from development session conversations. Use this document to update the PRD with current architectural decisions, feature implementations, and strategic direction.

---

## 1. Project Identity & Positioning

- **Tagline**: "Car Repair, Finally Fixed."
- **Brand anchor**: "Built in Detroit. Driven by trust."
- **Visual identity**: Modern fintech meets blue-collar reliability
  - Deep blue (#1E3A5F) for navigation/headers
  - Orange (#E67E22) for primary CTAs
  - Light background (#F0F4F8)
  - Teal (#2A9D8F) for DIY/diagnostic elements
  - Trust blue for shop/professional elements
- **Typography**: Poppins/DM Sans headings, Inter body text
- **Pre-launch positioning**: "Coming Soon" and "Launching in Detroit" language; strict prohibition on fabricated testimonials or claims of an established network

---

## 2. Homepage Architecture (Revised)

### CTA Audit & Cleanup (Latest Session)
The homepage was audited for CTA overload (10 CTAs → 5). The following changes were made:

**Current homepage flow (top to bottom):**
1. **Cinematic Hero** — 1 CTA: "Get Your Free Diagnosis" (B2B "Join as a Partner Shop" CTA removed)
2. **How It Works Video** — Product education walkthrough
3. **QuickActionBar** — Core conversion tool: "Get Your Diagnosis" (accepts DTC codes + free-text symptoms)
4. **Value Proposition Cards** — Transparent Pricing, Instant Quotes, Flexible Financing (no CTAs)
5. **Recommend a Shop** — Community-driven lead gen: "Recommend a Shop" button
6. **Testimonials Carousel** — Detroit-area social proof (no CTAs)
7. **Waitlist Signup** — "Be the First to Know" with email + name form
8. **Final CTA Banner** — 1 CTA: "Get Your Free Diagnosis" (B2B CTA removed, language aligned with hero)

**Sections removed from homepage:**
- "For Car Owners" card (redundant with hero messaging)
- OBD2 Scanner Integration section (non-functional duplicate; QuickActionBar already handles DTC codes)
- Floating chat widget placeholder (non-functional; erodes trust)
- All B2B CTAs ("Join as a Partner Shop" / "Become a Partner Shop") — these already exist on `/for-shops`

**Rationale**: Best practice is 1 primary CTA repeated 2–3x max. The homepage is strictly optimized for consumer conversion; B2B content lives on dedicated pages.

### CTA Language Decision
- **"Get Your Free Diagnosis"** chosen over "Get Your Free Quote" because the product currently delivers diagnoses (DTC lookup, symptom matching, DIY guidance) but does not yet deliver live shop quotes
- When shops are onboarded and quoting is live, CTA language should transition to "Get Your Free Quote"

### Waitlist Section Copy
- Removed "plus exclusive launch-day pricing" language
- Removed "(optional)" from the name field placeholder
- Current copy: "Wrenchli is launching in Detroit soon. Join the early access list and get notified when we go live."

---

## 3. Mobile Bottom Bar (Context-Aware)

The sticky mobile bottom bar (60px, blur background) is now **route-aware**:

| Route | Left CTA | Right CTA |
|-------|----------|-----------|
| All pages (default) | 🩺 Get a Diagnosis → `/#quote` | 🚗 DIY Diagnosis → `/vehicle-insights` |
| `/vehicle-insights` | 💳 Get a Quote → `/for-shops#apply` | 🔖 Save to Garage → `/garage` |

**Rationale**: After a diagnosis is complete, showing "Get a Diagnosis" again doesn't make sense. The bar adapts to show post-diagnosis actions.

---

## 4. Vehicle Identification System

Tri-mode identification (unchanged):
1. **Year/Make/Model dropdowns** — Cascading selectors
2. **Manual VIN entry** — 17-character input with NHTSA API decoding
3. **VIN barcode scanning** — Mobile camera-based scanning via html5-qrcode

All three modes feed into the same `VehicleData` type and persist via sessionStorage + URL params for deep-linking.

---

## 5. Diagnosis-to-DIY Pathway (Built & Enhanced)

### What's Implemented
| Feature | Status |
|---------|--------|
| DTC code lookup | ✅ Full database with descriptions, causes, severity |
| Symptom matching | ✅ Keyword-based matching against symptom library |
| Urgency badges | ✅ Visual severity indicators (low/medium/high) |
| DIY feasibility rating | ✅ Easy/Moderate/Advanced with color-coded cards |
| YouTube tutorials | ✅ Auto-searches repair tutorials for diagnosed issue + vehicle |
| Parts recommendations | ✅ Affiliate parts links matched to diagnosis |
| **Tool requirements** | ✅ **NEW** — Collapsible "Tools Needed" section per diagnosis |
| AI-powered diagnosis | ✅ Edge function using Gemini for deeper analysis |
| Vehicle context bar | ✅ Persists vehicle info across results page |
| Save to Garage | ✅ localStorage-based, up to 5 vehicles |
| Product walkthrough | ✅ Branching demo (DIY vs Shop path) with device-aware mockups |

### Tool Requirements (New Feature)
- **`src/data/toolsLibrary.ts`** — Tools mapped by DTC category (ignition, cooling, fuel, emissions, etc.) and by difficulty level as fallback
- Each tool has: name, emoji icon, required/optional flag
- Tools auto-populate based on DTC code category (if available) or repair difficulty level
- Displayed as a collapsible section in the DIY card: "Tools Needed (N)" with required tools listed first, optional tools separated below
- Categories covered: ignition, fuel, emissions, engine, cooling, electrical, transmission, evap, safety, abs, network, sensor, body, chassis

---

## 6. Diagnosis-to-Shop Pipeline (NOT Built)

### Current Gaps
| Gap | Impact |
|-----|--------|
| No shop listing/matching engine | Can't route diagnosed issues to specific shops |
| No quote request flow | "Get a Quote" links to shop application form, not consumer quote form |
| No shop profile pages | Nowhere to display services, ratings, pricing |
| No consumer → shop messaging | No way to connect parties |
| No pricing/estimate database | Can't show location-specific cost ranges |

### Recommended Build Phases
1. `shops` table (profile, services, location, status)
2. `quote_requests` table (linking diagnosis data → shop)
3. Shop matching UI on results page ("Shops near you that fix this")
4. Consumer quote request form pre-filled from diagnosis

---

## 7. Shop Recommendations Feature

- **Purpose**: Consumer-led lead generation — users refer trusted mechanics
- **Integration points**: Navigation, footer, diagnosis results, dedicated homepage section
- **Database**: `shop_recommendations` table (public insert, admin-only read)
- **"Check If You've Been Recommended"**: Lookup tool on `/for-shops` page provides social proof to potential shop partners
- **Counter**: StatCounter showing "127 shops recommended" (social proof)

---

## 8. My Garage Feature

- Zero-backend, localStorage-based
- Stores up to 5 vehicles (nickname, VIN, custom exterior color, body type)
- Most recently used vehicle pre-populates homepage QuickActionBar and diagnostic flows
- Dedicated `/garage` page with vehicle cards and diagnostic history
- Privacy notice explaining data stays on device

---

## 9. AI Chatbot

- Supabase Edge Function using Lovable AI gateway (Gemini models)
- Streaming responses
- Public, unauthenticated access (supports guest experience)
- Accessible site-wide

---

## 10. Technical Architecture

### Session Management
- Vehicle data persists via sessionStorage for active session
- Deep-linking via URL params (`?vin=`, `?code=`, `?symptom=`, `?year=`, `?make=`, `?model=`)
- Enables seamless handoffs from marketing partners or scanning hardware

### Database Tables (Supabase/Lovable Cloud)
| Table | Purpose | Access |
|-------|---------|--------|
| `waitlist_signups` | Email + name capture | Public insert, admin read |
| `shop_applications` | Shop partner applications | Public insert, admin read |
| `shop_recommendations` | Consumer-submitted shop referrals | Public insert, admin read |
| `contact_submissions` | Contact form entries | Public insert, admin read |
| `user_roles` | Admin role management | Admin only |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `diagnose` | AI-powered vehicle diagnosis |
| `chat` | Site-wide AI chatbot |

### Key Design Decisions
- No authentication required for any consumer-facing features (low-friction guest access)
- All forms use public insert RLS policies
- Admin-only read policies on all submission tables
- Mobile-first: 44px+ touch targets, 16px+ fonts, 60px sticky bottom bar

---

## 11. UX Principles

- **Homepage hierarchy**: Strictly consumer-focused; B2B content on dedicated pages
- **Guest access priority**: Quotes and diagnostics available without registration
- **Honest positioning**: No fabricated data or claims; "Coming Soon" language throughout
- **Mobile-first**: >60% expected traffic; all interactions optimized for touch
- **Dual-path choice**: Diagnosis results always present DIY and Professional options side by side

---

## 12. Pages Structure

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Consumer conversion funnel |
| For Car Owners | `/for-car-owners` | Consumer value proposition |
| For Shops | `/for-shops` | Shop partner recruitment + "Check If Recommended" |
| Vehicle Insights | `/vehicle-insights` | DIY diagnosis tool |
| About | `/about` | Company story, mission, team |
| FAQ | `/faq` | Consumer + shop owner FAQs |
| Contact | `/contact` | Contact form |
| Garage | `/garage` | Saved vehicles + diagnostic history |
| Investors | `/investors` | Investor information |
| Not Found | `*` | 404 page |

---

## 13. What's NOT Built Yet (Future Phases)

- Shop onboarding portal and profile pages
- Consumer quote request flow (diagnosis → shop matching → quote)
- Actual booking functionality
- Financing application flow
- User accounts / authentication
- Blog with CMS
- Real-time shop availability
- Payment processing
- Review/rating system
- Push notifications
- Native mobile app (PWA or Capacitor)
