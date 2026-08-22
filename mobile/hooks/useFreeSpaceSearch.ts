import { isAxiosError } from 'axios';
import { useCallback, useState } from 'react';
import type { Amenity, QueryResponse } from 'shared';
import { filterSpotsForAmenities, getDemoResponse } from '../data/demo-spots';
import { postQuery } from '../services/query';
import type { AmenityLabel, AppLanguage, SearchLocation } from '../types/app';

interface SearchState {
  error: string | null;
  loading: boolean;
  needsManualLocation: boolean;
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

const mentionsWifi = (query: string): boolean => /\bwi[\s-]?fi\b|\binternet\b/i.test(query);

export const useFreeSpaceSearch = (location: SearchLocation | null, language: AppLanguage) => {
  const [state, setState] = useState<SearchState>({
    error: null,
    loading: false,
    needsManualLocation: false,
    response: null,
    usingDemoData: false,
  });

  const search = useCallback(
    async (query: string, amenities: AmenityLabel[], overrideLocation?: SearchLocation | null) => {
      const searchLocation = overrideLocation === undefined ? location : overrideLocation;
      const searchAmenities: AmenityLabel[] = mentionsWifi(query)
        ? Array.from(new Set<AmenityLabel>([...amenities, 'Wi-Fi']))
        : amenities;
      setState(current => ({ ...current, error: null, loading: true, needsManualLocation: false }));

      try {
        const response = await postQuery({
          amenities: toApiAmenities(searchAmenities),
          ...(searchLocation && {
            location: {
              lat: searchLocation.lat,
              lon: searchLocation.lon,
              source: searchLocation.source,
            },
          }),
          language,
          query,
          radius_meters: 1500,
        });
        setState({
          error: null,
          loading: false,
          needsManualLocation: false,
          response: {
            ...response,
            spots: filterSpotsForAmenities(response.spots, searchAmenities),
          },
          usingDemoData: false,
        });
        return false;
      } catch (error) {
        const needsManualLocation = isAxiosError(error) && error.response?.status === 422;
        setState({
          error: needsManualLocation
            ? 'Choose a Boston neighborhood to see nearby places.'
            : 'Showing saved demo results while the local search service reconnects.',
          loading: false,
          needsManualLocation,
          response: needsManualLocation ? null : getDemoResponse(searchAmenities),
          usingDemoData: !needsManualLocation,
        });
        return needsManualLocation;
      }
    },
    [language, location],
  );

  return { ...state, search };
};
