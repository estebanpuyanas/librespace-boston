import type { QueryResponse, Spot } from 'shared';
import type { AmenityLabel } from '../types/app';

const sourceDataset = {
  accessible: 'BPRD Accessible Park Details Augmented',
  features: 'Park Features',
  has_wifi: 'Wicked Free Wi-Fi Locations',
  is_park: 'Open Space',
  tree_density_nearby: 'BPRD Trees',
};

export const demoSpots: Spot[] = [
  {
    spot_id: 'os-boston-common',
    name: 'Boston Common',
    lat: 42.3554,
    lon: -71.0657,
    distance_meters: 480,
    has_wifi: true,
    is_park: true,
    features: ['seating', 'restroom'],
    accessible: { value: true, notes: 'Stair-free access and wheelchair-accessible benches.' },
    tree_density_nearby: 84,
    source_dataset: sourceDataset,
  },
  {
    spot_id: 'os-leventhal-park',
    name: 'Norman B. Leventhal Park',
    lat: 42.3586,
    lon: -71.0568,
    distance_meters: 760,
    has_wifi: false,
    is_park: true,
    features: ['seating', 'playground'],
    accessible: { value: true, notes: 'Accessible park details available.' },
    tree_density_nearby: 41,
    source_dataset: sourceDataset,
  },
  {
    spot_id: 'os-greenway',
    name: 'Rose Kennedy Greenway',
    lat: 42.3611,
    lon: -71.0571,
    distance_meters: 960,
    has_wifi: false,
    is_park: true,
    features: ['seating'],
    accessible: { value: false },
    tree_density_nearby: 25,
    source_dataset: sourceDataset,
  },
];

const matchesSelectedAmenity = (spot: Spot, amenity: AmenityLabel): boolean => {
  switch (amenity) {
    case 'Wi-Fi':
      return spot.has_wifi;
    case 'Seating':
      return spot.features.includes('seating');
    case 'Shade':
      return spot.features.includes('shade_structure') || spot.tree_density_nearby >= 30;
    case 'Accessible':
      return spot.accessible.value;
    case 'Playground':
      return spot.features.includes('playground');
  }
};

export const filterSpotsForAmenities = (spots: Spot[], amenities: AmenityLabel[]): Spot[] => {
  if (amenities.length === 0) return spots;
  return spots.filter(spot => amenities.every(amenity => matchesSelectedAmenity(spot, amenity)));
};

export const getDemoResponse = (amenities: AmenityLabel[]): QueryResponse => {
  const matches = filterSpotsForAmenities(demoSpots, amenities);
  const spots = matches.length > 0 ? matches : demoSpots;

  return {
    answer: null,
    detected_language: null,
    disclaimers: ['Demo results shown while the local search service reconnects.'],
    highlights: {
      closest_park: spots[0]?.spot_id ?? null,
      closest_restroom: spots.find(spot => spot.features.includes('restroom'))?.spot_id ?? null,
      closest_wifi: spots.find(spot => spot.has_wifi)?.spot_id ?? null,
    },
    resolved_location: {
      approximate: false,
      label: 'Downtown Boston',
      lat: 42.3554,
      lon: -71.0657,
      source: 'manual',
    },
    spots,
    translated_query: null,
  };
};
