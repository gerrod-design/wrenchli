import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PartnerSlot from '@/components/journey/PartnerSlot';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('PartnerSlot', () => {
  it('consumer surface shows waitlist form and honest copy', () => {
    const { container } = render(
      <PartnerSlot
        label="Rideshare"
        description="Get a ride while we work on your car."
        surface="consumer"
        slotKey="rideshare_slot"
      />
    );

    expect(screen.getByText('Partner launching soon')).toBeInTheDocument();

    const emailInput = container.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();

    expect(document.body.textContent).not.toMatch(/book now|reserve|checkout|apply now/i);
  });

  it('partner_preview surface shows contact CTA and no waitlist form', () => {
    const { container } = render(
      <PartnerSlot
        label="Rideshare"
        description="Get a ride while we work on your car."
        surface="partner_preview"
        slotKey="rideshare_slot"
      />
    );

    expect(screen.getByText('Open partner slot')).toBeInTheDocument();
    expect(
      screen.getByText('Launching with partners nationally — be first.')
    ).toBeInTheDocument();

    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toMatch(/\/contact$/);
    expect(anchors[0].textContent).toMatch(/partner/i);

    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByText('Partner launching soon')).not.toBeInTheDocument();
  });
});
