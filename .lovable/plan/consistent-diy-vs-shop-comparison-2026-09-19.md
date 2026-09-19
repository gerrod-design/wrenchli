# Consistent DIY vs. Shop Comparison

## Goal
Make every DIY-eligible assessment and repair plan show one clear comparison with distinct DIY and shop costs and one consistent job time.

## Changes
1. **Strengthen assessment outputs**
   - Update both assessment prompts to return separate DIY parts cost, DIY time, shop parts cost, shop labor cost, shop total cost, and shop time.
   - Explicitly prohibit reusing a cost range for multiple meanings.
   - Keep the existing brakes, steering, airbags, and fuel hard block unchanged.
   - Treat filters, wipers, and bulbs as routine maintenance, never “schedule a repair.”
   - Add deterministic response checks so shop totals reconcile with parts plus labor and safety-critical causes remain shop-only.

2. **Keep the repair plan consistent**
   - Pass the assessment’s structured costs and times into the repair-plan prompt as authoritative values.
   - Instruct the plan not to invent or restate conflicting cost or time estimates in summaries or next steps.
   - Generate DIY steps for each linked part; remove purchase links for any part without steps.

3. **Present one glanceable comparison**
   - Replace scattered DIY/shop cost and time lines with one paired comparison in each assessment result and repair plan.
   - Show DIY parts and time beside shop parts, labor, total, and time.
   - Remove duplicate cost/time displays that could disagree.

4. **Preserve required protections**
   - Keep safety-critical results at “Shop Required” with zero DIY instructions or parts links.
   - Keep the affiliate disclosure and “not a licensed mechanic” disclaimer unchanged.

5. **Verify and deploy**
   - Add focused tests for distinct costs, consistent time, maintenance wording, parts-link eligibility, and safety blocking.
   - Run the relevant test suite and type checks.
   - Redeploy `diagnose-vehicle`, `generate-recommendation`, `diagnose`, and any additional function whose prompt changes.
   - Report each deployment result and quote any errors verbatim.

## Technical notes
- Extend the existing diagnosis and recommendation response types rather than deriving conflicting estimates in the browser.
- Preserve current database compatibility; the comparison data can travel with the active assessment response without altering existing saved columns.
- Normalize malformed AI ranges before returning them so the shop total always equals shop parts plus shop labor.
