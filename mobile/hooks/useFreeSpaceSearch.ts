import { useCallback, useState } from 'react';
import type { Amenity, QueryResponse } from 'shared';
import { filterSpotsForAmenities, getDemoResponse } from '../data/demo-spots';
import { postQuery } from '../services/query';
import type { AmenityLabel, SearchLocation } from '../types/app';

interface SearchState {
  error: string | null;
  loading: boolean;
  response: QueryResponse | null;
  usingDemoData: boolean;
}

const apiAmenity: Partial<Record<AmenityLabel, Amenity>> = {
  Accessible: 'accessible',
  Playground: 'playground',
  Shade: 'shade',
  'Wi-Fi': 'wifi',
};

const toApiAmenities = (selected: AmenityLabel[]): Amenity[] =>
  selected.flatMap(label => (apiAmenity[label] ? [apiAmenity[label]] : []));

export const useFreeSpaceSearch = (location: SearchLocation) => {
  const [state, setState] = useState<SearchState>({
    error: null,
    loading: false,
    response: null,
    usingDemoData: false,
  });

  const search = useCallback(
    async (query: string, amenities: AmenityLabel[]) => {
      setState(current => ({ ...current, error: null, loading: true }));

      try {
        const response = await postQuery({
          amenities: toApiAmenities(amenities),
          location: { lat: location.lat, lon: location.lon, source: 'ip' },
          query,
          radius_meters: 1500,
        });
        setState({
          error: null,
          loading: false,
          response: { ...response, spots: filterSpotsForAmenities(response.spots, amenities) },
          usingDemoData: false,
        });
      } catch {
        setState({
          error: 'Showing saved demo results while the local search service reconnects.',
          loading: false,
          response: getDemoResponse(amenities),
          usingDemoData: true,
        });
      }
    },
    [location.lat, location.lon],
  );

  return { ...state, search };
};
