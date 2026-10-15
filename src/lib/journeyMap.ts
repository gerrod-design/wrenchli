export type JourneyStageStatus = 'live' | 'v1' | 'later';
export type JourneyLane = 'consumer' | 'shop';

export interface JourneyStage {
  id: string;
  lane: JourneyLane;
  title: string;
  summary: string;
  status: JourneyStageStatus;
  laterReason?: string;
  partnerNote: string;
  featureRefs: string[];
}

export const FEATURE_TITLES: Record<string, string> = {
  F1: 'Mobile inspection, with eligible onsite repair',
  F2: 'Pickup & delivery or tow-to-shop for an immobile vehicle',
  F3: 'Alternate mobility after assessment — transit, rideshare, rental',
  F4: 'Upfront repair-financing options',
  F5: 'Garage surfaces existing service contracts and likely coverage',
};

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'C1',
    lane: 'consumer',
    title: 'Life is already moving',
    summary:
      'Work, school, and errands fill the day; vehicle health is background noise until it is not. This is context, not software.',
    status: 'live',
    partnerNote:
      'Every Wrenchli journey starts here — an owner with a day to protect, not a car enthusiast.',
    featureRefs: [],
  },
  {
    id: 'C2',
    lane: 'consumer',
    title: 'A signal interrupts the day',
    summary:
      'A warning light, noise, smell, vibration, or breakdown creates urgency without meaning; the owner captures picture and sound with Use Your Senses.',
    status: 'live',
    partnerNote: 'Symptom capture (picture + sound) is live in the product today.',
    featureRefs: [],
  },
  {
    id: 'C3',
    lane: 'consumer',
    title: 'Wrenchli makes the first sense of it',
    summary:
      'Free preliminary assessment in plain language, with DIY-versus-shop guidance, without forcing a hardware purchase.',
    status: 'live',
    partnerNote: 'The free assessment is live today and is always free to the consumer.',
    featureRefs: [],
  },
  {
    id: 'C4',
    lane: 'consumer',
    title: 'Owner chooses the next step — and how to keep moving',
    summary:
      'The owner picks a path — monitor, DIY, mobile inspection, eligible onsite repair, pickup or tow — and compares transit, rideshare, rental, or a shop loaner while the car is down. The guided plan for this stage is built in this release.',
    status: 'v1',
    partnerNote:
      'Mobility, towing, and mobile-inspection fulfillment are partner slots in this build — the plan is real, the fulfillment launches with partners.',
    featureRefs: ['F1', 'F2', 'F3'],
  },
  {
    id: 'C5',
    lane: 'consumer',
    title: 'Coverage and affordability enter before commitment',
    summary:
      'Before work is approved, the Garage can surface an active service contract and what may be covered, and the owner can review financing options. Guidance stays independent — likely coverage is never a guarantee.',
    status: 'v1',
    partnerNote:
      'Financing applications are a partner slot in this build; the options page and waitlist are real today.',
    featureRefs: ['F4', 'F5'],
  },
  {
    id: 'S1',
    lane: 'shop',
    title: 'The schedule is already loaded',
    summary:
      'Bays, technicians, parts, and promised completion times are already allocated. This is the shop\u2019s everyday reality.',
    status: 'live',
    partnerNote: 'Wrenchli\u2019s job is to send better-prepared owners into that schedule — not more interruptions.',
    featureRefs: [],
  },
  {
    id: 'S2',
    lane: 'shop',
    title: 'An unscheduled owner arrives',
    summary: 'The description may be vague, urgency is high, and shop capacity is uncertain.',
    status: 'live',
    partnerNote: 'This is the moment the starting brief (next stage) is built to improve.',
    featureRefs: [],
  },
  {
    id: 'S3',
    lane: 'shop',
    title: 'Wrenchli delivers a better starting brief',
    summary:
      'Owner-approved symptoms, context, and vehicle information reduce the translation gap — never a substitute for the shop\u2019s professional inspection.',
    status: 'live',
    partnerNote:
      'Owner-approved briefs and referral packages are live today; owners control exactly what is shared.',
    featureRefs: [],
  },
  {
    id: 'S4',
    lane: 'shop',
    title: 'Shop — and technician expertise — earn the repair',
    summary:
      'A capability appears only where a shop has declared it — loaner cars, shuttle, pickup & delivery, mobile service.',
    status: 'later',
    laterReason:
      'Technician profiles and verified facility-strength presentation are a shop-side build beyond this release. Capability declarations — loaner cars, shuttle, pickup & delivery, mobile service — are the seed of it and are built in this release: a capability appears only where a shop has declared it. Technician profiles (name, photo, credentials, bio) belong to that same shop-declared profile data: the profile a shop\'s digital inspection report already shows its customer, down to the signed attestation, should be the same profile the customer sees when choosing the shop — declared by the shop, never invented by Wrenchli.',
    partnerNote: 'No paid rank, ever. Shops earn the repair on verified strengths, fit, and trust.',
    featureRefs: [],
  },
  {
    id: 'S5',
    lane: 'shop',
    title: 'Completion closes the loop',
    summary:
      'Verified completion evidence closes the loop between the brief, the repair, and the outcome.',
    status: 'later',
    laterReason:
      'Verified completion evidence and the per-repair outcome fee (with its monthly ceiling) depend on the completion-evidence workflow, which is not built yet. Nothing in this release charges a shop anything.',
    partnerNote:
      'When this launches, the shop\u2019s cost is tied to a completed, evidenced outcome — never to clicks or placement.',
    featureRefs: [],
  },
];

export const HANDOFF_LABEL =
  'Trusted handoff — the owner chooses the shop, and the shop starts from the brief.';
