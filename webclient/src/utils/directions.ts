import type { Spot } from 'shared';

export const getWalkingDirectionsUrl = (spot: Spot) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${spot.lat},${spot.lon}`)}&travelmode=walking`;
