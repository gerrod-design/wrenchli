

# Wrenchli — Full Website Build Plan

## Overview
A professional, multi-page marketing website for Wrenchli's pre-launch phase. The site follows the provided design system (deep blue nav/footer, light content sections, orange CTAs) with working waitlist forms backed by Supabase. Mobile-first, scroll-animated, and built to establish trust and credibility.

---

## Pages (7 total)

### 1. Home / Landing Page
- **Hero section** (75-80vh on mobile): Bold headline about fixing the broken auto repair experience, animated stat counters (e.g. "$288B industry," "300% price variance," "2 in 3 don't trust their mechanic"), two CTAs — "Join the Waitlist" (orange) + "I'm a Shop Owner" (secondary)
- **How It Works**: 3-step visual flow (Describe Your Repair → Compare Quotes → Book & Save)
- **Three Pillars section**: Cards for Marketplace, Shop SaaS, and Financing — each with icon, description, and link to detail page
- **Why Wrenchli**: Trust indicators, transparency messaging, "coming to Detroit" positioning
- **Waitlist signup** inline section with email capture
- **Footer**: Company info, nav links, social links (LinkedIn), legal links

### 2. For Car Owners (Consumer)
- Value proposition for consumers: price transparency, vetted shops, easy booking
- Feature cards: Instant quotes, shop comparison, verified reviews, financing options
- "How pricing works" explainer section
- Waitlist CTA: "Get notified when we launch in Detroit"

### 3. For Shop Owners
- Value proposition for shops: pre-qualified customers, modern tools, grow your business
- SaaS features showcase: scheduling, inspections, payments, customer management
- Pricing preview ($299/mo positioning)
- "Apply for Early Access" waitlist form (collects shop name, location, email, phone)

### 4. Vehicle Insights (DIY / Diagnostic)
- Teal-themed section explaining the diagnostic feature concept
- Tabs/modes: DTC Code Lookup, Symptom Checker, Maintenance Schedules
- Pre-launch: static explainer content with "Coming Soon" badges
- CTA to join waitlist for early access

### 5. About / Team
- Company story, mission, Detroit roots
- Founding team section (placeholder cards — name, title, bio)
- Timeline / milestones visual
- Values section (Transparency, Trust, Accessibility)

### 6. FAQ
- Accordion-style FAQ covering: How it works, pricing, for shops, financing, launch timeline
- Separate sections for Consumer FAQs and Shop Owner FAQs
- CTA at bottom to contact or join waitlist

### 7. Contact
- Contact form (name, email, subject dropdown, message) — stored in Supabase
- Company address (Detroit, MI)
- Links to LinkedIn and future social channels

---

## Shared Components

- **Navigation**: Sticky top nav with logo, page links, "Join Waitlist" CTA button. Mobile: hamburger → full-screen overlay with large tap-friendly links
- **Sticky Mobile Bottom Bar**: Fixed bottom bar with "Get a Quote" + "DIY Diagnosis" buttons (60px tall, blur background)
- **Footer**: Multi-column with links, company info, social, legal
- **Back-to-top button**: Appears after 2 viewport heights of scrolling
- **Waitlist modal/form**: Reusable component, email + optional name, Supabase integration

---

## Backend (Supabase)

- **Waitlist table**: Captures email, name, user type (consumer/shop), source page, timestamp
- **Shop interest table**: Shop name, owner name, email, phone, location, timestamp
- **Contact submissions table**: Name, email, subject, message, timestamp
- No authentication required — public forms with basic validation

---

## Design & UX Details

- **Colors**: Deep blue (#1E3A5F) headers/nav/footer, light (#F0F4F8) alternating sections, orange (#E67E22) CTAs, green/teal/blue accent sections per pillar
- **Typography**: Poppins/DM Sans headings, Inter body text, large stat numbers
- **Animations**: Staggered hero fade-in, scroll-triggered section reveals, card hover lifts, animated number counters, skeleton loading states
- **Mobile-first**: 44px+ touch targets, proper input types, responsive grids, lazy-loaded images, 16px minimum font size
- **Honest positioning**: "Launching in Detroit" / "Coming Soon" language throughout — no fabricated testimonials or claims

---

## What's NOT Included (Future Phases)
- Actual quote/booking functionality
- Shop onboarding portal
- Financing application flow
- User accounts / authentication
- Blog with CMS
- Real diagnostic tool integration

