import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShopCard, { type Shop } from '@/components/shops/ShopCard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const baseShop: Shop = {
  id: 'shop-1',
  name: 'Test Auto Care',
  rating: 4.5,
  review_count: 120,
  address: '123 Woodward Ave, Detroit, MI',
  phone: '313-555-0100',
  distance_miles: 2.1,
  specialties: ['brakes'],
  price_tier: 'mid',
  response_time: 'Same day',
  availability: 'next_day',
  wrenchli_verified: false,
  quote_url: '',
};

const ALL_LABELS = ['Loaner cars', 'Shuttle', 'Pickup & delivery', 'Mobile service'];

describe('ShopCard capabilities', () => {
  it('renders only loaner cars badge', () => {
    render(<ShopCard shop={baseShop} capabilities={['loaner_cars']} />);
    expect(screen.getByText('Loaner cars')).toBeInTheDocument();
    expect(screen.queryByText('Shuttle')).not.toBeInTheDocument();
    expect(screen.queryByText('Pickup & delivery')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobile service')).not.toBeInTheDocument();
  });

  it('renders shuttle and mobile service badges', () => {
    render(
      <ShopCard shop={baseShop} capabilities={['shuttle', 'mobile_service']} />
    );
    expect(screen.getByText('Shuttle')).toBeInTheDocument();
    expect(screen.getByText('Mobile service')).toBeInTheDocument();
    expect(screen.queryByText('Loaner cars')).not.toBeInTheDocument();
  });

  it('renders no badges for empty capabilities array', () => {
    render(<ShopCard shop={baseShop} capabilities={[]} />);
    ALL_LABELS.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/no (mobile service|loaner|shuttle|capabilit)/i);
  });

  it('renders no badges when capabilities prop omitted', () => {
    render(<ShopCard shop={baseShop} />);
    ALL_LABELS.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });

  it('ignores unknown capability values', () => {
    render(<ShopCard shop={baseShop} capabilities={['bogus_capability']} />);
    expect(screen.queryByText('bogus_capability')).not.toBeInTheDocument();
  });
});
