import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PartnersJourney from '@/pages/PartnersJourney';
import { JOURNEY_STAGES } from '@/lib/journeyMap';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('PartnersJourney page', () => {
  it('renders every stage title', () => {
    render(<PartnersJourney />);
    JOURNEY_STAGES.forEach((stage) => {
      expect(screen.getAllByText(stage.title).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the status legend', () => {
    render(<PartnersJourney />);
    expect(screen.getAllByText('Live today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('New in this build').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Coming with partners').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the standing partner phrase', () => {
    render(<PartnersJourney />);
    expect(
      screen.getAllByText('Launching with partners in Detroit and Columbus — be first.').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders exactly two "Why not yet:" explanations', () => {
    render(<PartnersJourney />);
    expect(screen.getAllByText(/Why not yet:/).length).toBe(2);
  });

  it('renders the trusted handoff divider', () => {
    render(<PartnersJourney />);
    expect(screen.getByText(/Trusted handoff/)).toBeInTheDocument();
  });

  it('renders the embedded journey plan demo', () => {
    render(<PartnersJourney />);
    expect(screen.getByText('While your car is being fixed')).toBeInTheDocument();
    expect(screen.getByText(/same component consumers get/)).toBeInTheDocument();
  });

  it('stays honest about current scope', () => {
    render(<PartnersJourney />);
    expect(document.body.textContent).not.toMatch(/book now|dispatch|checkout/i);
    expect(document.body.textContent).not.toMatch(/diagnos/i);
  });
});
