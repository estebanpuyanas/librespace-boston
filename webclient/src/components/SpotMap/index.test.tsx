import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Spot } from 'shared';
import { afterEach, describe, expect, it } from 'vitest';
import SpotMap from '.';

const featuredSpot: Spot = {
  spot_id: 'featured',
  name: 'Featured Garden',
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
  ...featuredSpot,
  spot_id: 'alternative',
  name: 'Alternative Plaza',
  lat: 42.361,
  lon: -71.057,
  distance_meters: 350,
};

afterEach(cleanup);

describe('SpotMap', () => {
  it('opens distinct callouts and walking directions for the featured and alternative coordinates', () => {
    render(
      <SpotMap location={{ lat: 42.36, lon: -71.06 }} spots={[featuredSpot, alternativeSpot]} />,
    );

    expect(screen.getByTitle('Search location')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Top pick: Featured Garden'));
    expect(
      screen.getByRole('link', { name: 'Walking directions to Featured Garden' }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=42.3551%2C-71.0656&travelmode=walking',
    );

    fireEvent.click(screen.getByTitle('Alternative 2: Alternative Plaza'));
    expect(
      screen.getByRole('link', { name: 'Walking directions to Alternative Plaza' }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=42.361%2C-71.057&travelmode=walking',
    );
  });

  it('degrades safely when no result or search location has valid coordinates', () => {
    const missingCoordinates = {
      ...featuredSpot,
      lat: undefined,
      lon: undefined,
    } as unknown as Spot;
    const invalidCoordinates = { ...alternativeSpot, lat: Number.NaN, lon: 200 };

    render(<SpotMap location={null} spots={[missingCoordinates, invalidCoordinates]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Map unavailable for these results');
    expect(
      screen.queryByLabelText('Map of the search location and free places'),
    ).not.toBeInTheDocument();
  });
});
