-- =============================================================
-- Seed: MOCK financing partners for the simulation harness.
--
-- OPS-ONLY. Run manually against a dev / staging / preview
-- database (or a local PGlite replay, as the migration tests do).
-- NEVER run against production as a substitute for signing a real
-- partner: every row here is is_mock = true, is excluded from the
-- public financing page at the data layer, and exists only so the
-- platform's behavior can be exercised end to end in simulation.
--
-- Partner types mirror the ranking of record: credit union,
-- community bank, large bank, qualifying 0% fintech tier, and one
-- deliberately over-ceiling lender that the 24% APR rule must
-- filter out of presentation.
--
-- Idempotent: safe to re-run. Teardown is at the bottom.
-- =============================================================

INSERT INTO public.financing_partners
  (id, name, partner_type, zero_percent_tier, apr_percent, term_months,
   min_amount_cents, max_amount_cents, link_url_template, rank_order,
   is_active, is_mock)
VALUES
  ('f0000000-0000-4000-8000-000000000001', 'Mock Credit Union', 'credit_union',
   false, 11.99, 12, 25000, 120000,
   'https://mock-partner.invalid/credit-union/apply?ref={token}', 10, true, true),
  ('f0000000-0000-4000-8000-000000000002', 'Mock Community Bank', 'community_bank',
   false, 16.50, 12, 10000, 200000,
   'https://mock-partner.invalid/community-bank/apply?ref={token}', 20, true, true),
  ('f0000000-0000-4000-8000-000000000003', 'Mock National Bank', 'large_bank',
   false, 19.99, 24, 10000, 500000,
   'https://mock-partner.invalid/national-bank/apply?ref={token}', 30, true, true),
  ('f0000000-0000-4000-8000-000000000004', 'Mock Fintech 0% Tier', 'fintech',
   true, NULL, 12, 10000, 300000,
   'https://mock-partner.invalid/fintech/apply?ref={token}', 40, true, true),
  ('f0000000-0000-4000-8000-000000000005', 'Mock Over-Ceiling Lender', 'fintech',
   false, 32.00, 12, NULL, NULL,
   'https://mock-partner.invalid/over-ceiling/apply?ref={token}', 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  partner_type = EXCLUDED.partner_type,
  zero_percent_tier = EXCLUDED.zero_percent_tier,
  apr_percent = EXCLUDED.apr_percent,
  term_months = EXCLUDED.term_months,
  min_amount_cents = EXCLUDED.min_amount_cents,
  max_amount_cents = EXCLUDED.max_amount_cents,
  link_url_template = EXCLUDED.link_url_template,
  rank_order = EXCLUDED.rank_order,
  is_active = EXCLUDED.is_active,
  is_mock = EXCLUDED.is_mock,
  updated_at = now();

-- =============================================================
-- TEARDOWN (run manually to remove every mock and its records):
--
-- DELETE FROM public.financing_outcomes
--  WHERE referral_id IN (SELECT id FROM public.financing_referrals
--                        WHERE partner_id IN (SELECT id FROM public.financing_partners
--                                             WHERE is_mock));
-- DELETE FROM public.financing_referrals
--  WHERE partner_id IN (SELECT id FROM public.financing_partners WHERE is_mock);
-- DELETE FROM public.financing_partners WHERE is_mock;
-- =============================================================
