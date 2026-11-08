// FAQ content — single source of truth.
// Rendered by src/pages/FAQ.tsx and used to build the FAQPage JSON-LD in
// src/lib/structuredData.ts, so the structured data can never drift from
// the questions and answers visitors actually see on /faq.

export interface FaqItem {
  q: string;
  a: string;
}

export const consumerFaqs: FaqItem[] = [
  { q: "How does Wrenchli work?", a: "You describe your symptoms or enter a diagnostic code, and Wrenchli gives you a free pre-assessment — likely causes, how urgent it is, and a fair cost range. Where a participating shop has joined our free referral pilot — free for the shop until it completes its first five referred repairs — you can send that shop a Stage 1 package with your vehicle and your concern — never your name or contact details. If the shop accepts, you contact the shop directly. Wrenchli doesn't provide shop quotes or book appointments." },
  { q: "Is Wrenchli free for vehicle owners?", a: "Yes. The assessment is completely free for vehicle owners, and Wrenchli never charges you anything." },
  { q: "How do you vet the shops?", a: "Shops in our referral pilot are independent shops that have enrolled in the program. Wrenchli doesn't certify or guarantee any shop — check the shop's own credentials and reviews before you authorize work. Shops report the outcome of each referred repair back to Wrenchli." },
  { q: "Can I finance my repair?", a: "Not yet. We're building it now, starting in Michigan with that state's upcoming Affordable Loan program and 0% installment plans. See every way to pay and join the notify list on our financing page. Our rule: we'll never show a loan above 24% APR." },
  { q: "When is Wrenchli launching?", a: "The symptom assessment is live now and free for any U.S. vehicle owner. Our free referral pilot is open to independent shops nationally — free for each shop until it completes its first five referred repairs — and referrals are available wherever participating shops have joined." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program. Details will be announced before launch." },
];

export const shopFaqs: FaqItem[] = [
  // Shop track: free referral pilot now enrolling — free until a shop completes its first five referred repairs (replaces 2026-09-17 pause).
  { q: "Can my shop join Wrenchli?", a: "Yes — we're now enrolling independent shops in a free referral pilot, free until your shop completes its first five referred repairs: pre-assessed customers, no exclusivity, no auto-billing. See /for-shops for details." },
  { q: "How much does Wrenchli cost for shops?", a: "The referral pilot is free until your shop completes its first five referred repairs. After that, founding shops get their terms in writing before anything is charged, and we'll review your results together. Nothing is automatic." },
  { q: "How do I get customers through Wrenchli?", a: "Join the free referral pilot. When a customer chooses your shop, you receive a Stage 1 package — the vehicle and the concern, with symptoms, likely causes, and a fair cost range already assessed — never the customer's name or contact details. If you accept, the customer contacts you directly. The price of admission: a 2-minute outcome report on each referral." },
  { q: "Will you offer shop software or integrations?", a: "Not at this time. If that changes, we'll announce what integrations are actually available." },
];
