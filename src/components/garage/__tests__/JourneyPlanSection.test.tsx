import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JourneyPlanSection from '@/components/garage/JourneyPlanSection';
import { buildJourneyPlan } from '@/lib/journeyPlan';

const mockState = vi.hoisted(() => ({
  plan: null as any,
  contracts: [] as any[],
}));

vi.mock('@/lib/journeyPlanData', () => ({
  getLatestJourneyPlanForVehicle: vi.fn(async () => mockState.plan),
  getServiceContracts: vi.fn(async () => mockState.contracts),
  saveJourneyPlan: vi.fn(async () => mockState.plan),
  saveServiceContract: vi.fn(async () => mockState.contracts[0]),
}));

const planInput = {
  downtimeDaysMin: 2,
  downtimeDaysMax: 4,
  dailyDistanceMiles: 18,
  budgetTier: 'medium' as const,
  vehicleDrivable: false,
  metroArea: 'detroit' as const,
  issueCategory: 'brakes' as const,
};

const planRow = {
  id: 'plan-1',
  user_id: 'user-1',
  vehicle_id: 'veh-1',
  assessment_id: null,
  downtime_days_min: 2,
  downtime_days_max: 4,
  daily_distance_miles: 18,
  budget_tier: 'medium',
  vehicle_drivable: false,
  metro_area: 'detroit',
  issue_category: 'brakes',
  plan_snapshot: buildJourneyPlan(planInput),
  layer: 'reported',
  source_type: 'owner',
  created_at: '2026-10-15T00:00:00Z',
  updated_at: '2026-10-15T00:00:00Z',
};

const contractRow = {
  id: 'c-1',
  user_id: 'user-1',
  vehicle_id: 'veh-1',
  provider_name: 'Acme Warranty Co',
  plan_name: 'Powertrain Plus',
  coverage_notes: 'Powertrain',
  expires_on: null,
  layer: 'reported',
  source_type: 'owner',
  created_at: '2026-10-15T00:00:00Z',
  updated_at: '2026-10-15T00:00:00Z',
};

describe('JourneyPlanSection', () => {
  beforeEach(() => {
    mockState.plan = null;
    mockState.contracts = [];
  });

  it('renders the empty state with form and no coverage banner', async () => {
    render(<JourneyPlanSection vehicleId="veh-1" userId="user-1" />);

    await screen.findByText('While your car is being fixed');
    expect(screen.getByText(/How long will your car be in the shop/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'No service contract on file yet. Add one so we can flag when repairs may be covered.'
      )
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/does not determine coverage/);
  });

  it('renders an existing plan and contract with coverage banner', async () => {
    mockState.plan = planRow;
    mockState.contracts = [contractRow];

    render(<JourneyPlanSection vehicleId="veh-1" userId="user-1" issueCategory="brakes" />);

    await screen.findByText(/Downtime: 2–4 days/);
    expect(screen.getByText('Getting around')).toBeInTheDocument();
    expect(screen.getByText('Getting the car there')).toBeInTheDocument();
    expect(screen.getByText('Paying for it')).toBeInTheDocument();

    expect(screen.getByText('Acme Warranty Co')).toBeInTheDocument();
    expect(screen.getByText('Reported by you')).toBeInTheDocument();

    expect(document.body.textContent).toMatch(/does not determine coverage/);
    expect(document.body.textContent).toContain('Acme Warranty Co');
  });
});
