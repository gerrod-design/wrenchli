// FAQ content — single source of truth.
// Rendered by src/pages/FAQ.tsx and used to build the FAQPage JSON-LD in
// src/lib/structuredData.ts, so the structured data can never drift from
// the questions and answers visitors actually see on /faq.

export interface FaqItem {
  q: string;
  a: string;
}

export const consumerFaqs: FaqItem[] = [
  { q: "How does Wrenchli work?", a: "You describe your repair or enter a diagnostic code. Wrenchli sends your request to vetted local shops who provide real-time, binding quotes. You compare prices, read reviews, and book — all online." },
  { q: "Is Wrenchli free for vehicle owners?", a: "Yes, completely free. We charge shops a small transaction fee — not you. The price you see is the price you pay." },
  { q: "How do you vet the shops?", a: "Our Detroit Spotlight shops are hand-verified — we check business registration, reviews, and specialties before listing. As shops join our referral pilot, we'll add state mechanic-certification checks where a state requires them and track verified repair outcomes." },
  { q: "Can I finance my repair?", a: "Not yet — we're building it now, starting with Michigan's upcoming Affordable Loan program and 0% installment plans. See every way to pay and join the notify list on our financing page. Our rule: we'll never show a loan above 24% APR." },
  { q: "When is Wrenchli launching?", a: "The symptom assessment is live now and free for any U.S. vehicle owner. We're now enrolling independent shops in a free 90-day referral pilot — join the waitlist and we'll notify you as matching goes live in your area." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program. Details will be announced before launch." },
];

export const shopFaqs: FaqItem[] = [
  // Shop track: free 90-day referral pilot now enrolling (replaces 2026-09-17 pause).
  { q: "Can my shop join Wrenchli?", a: "Yes — we're now enrolling independent shops in a free 90-day referral pilot: pre-assessed customers, no exclusivity, no auto-billing. See /for-shops for details." },
  { q: "How much does Wrenchli cost for shops?", a: "The 90-day referral pilot is free. After the pilot we'll review your results together — pilot shops get founding terms on paid tiers before public pricing." },
  { q: "How do I get customers through Wrenchli?", a: "Join the free referral pilot and we'll send you customers with their symptoms, likely causes, and a fair cost range already assessed. The price of admission: a 2-minute outcome report on each referral." },
  { q: "Will you offer shop software or integrations?", a: "Not at this time. When the shop track reopens, we'll announce what integrations are actually available." },
];
