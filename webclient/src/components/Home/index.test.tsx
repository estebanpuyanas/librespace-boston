import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { QueryResponse, Spot } from 'shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from '.';

const primarySpot: Spot = {
  spot_id: 'primary',
  name: 'Primary Park',
  lat: 42.3551,
  lon: -71.0656,
  distance_meters: 200,
  has_wifi: true,
  is_park: true,
  features: ['seating'],
  accessible: { value: true },
  tree_density_nearby: 12,
  source_dataset: { name: 'Test data' },
};

const alternativeSpot: Spot = {
  ...primarySpot,
  spot_id: 'alternative',
  name: 'Alternative Plaza',
  lat: 42.361,
  lon: -71.057,
  distance_meters: 350,
};

const response: QueryResponse = {
  spots: [primarySpot, alternativeSpot],
  disclaimers: [],
  resolved_location: null,
};

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({ data: { lat: 42.36, lon: -71.06 }, loading: false, error: null }),
}));

vi.mock('../../hooks/useNearbySpots', () => ({
  useNearbySpots: () => ({ data: response, loading: false, error: null }),
}));

vi.mock('../../hooks/useQuerySearch', () => ({
  useQuerySearch: () => ({
    data: null,
    loading: false,
    error: null,
    submitted: false,
    submit: vi.fn(),
    clear: vi.fn(),
  }),
}));

afterEach(cleanup);

describe('Home directions links', () => {
  it('opens walking directions for the primary spot', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=42.3551%2C-71.0656&travelmode=walking',
    );
  });

  it('opens walking directions for the selected alternative, not the primary spot', () => {
    render(<Home />);

    const alternativeLink = screen.getByRole('link', { name: /alternative plaza/i });
    expect(alternativeLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=42.361%2C-71.057&travelmode=walking',
    );
    expect(alternativeLink).toHaveAttribute('target', '_blank');
    expect(alternativeLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(alternativeLink).not.toHaveAttribute('href', expect.stringContaining('42.3551'));
  });
});
