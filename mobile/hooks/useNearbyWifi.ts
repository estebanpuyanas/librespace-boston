import { useEffect, useState } from 'react';
import type { Spot } from 'shared';
import { postQuery } from '../services/query';
import type { SearchLocation } from '../types/app';

interface NearbyWifiState {
  loading: boolean;
  spot: Spot | null;
}

export const useNearbyWifi = (location: SearchLocation | null): NearbyWifiState => {
  const [state, setState] = useState<NearbyWifiState>({ loading: false, spot: null });
  const lat = location?.lat;
  const lon = location?.lon;
  const source = location?.source;

  useEffect(() => {
    if (lat === undefined || lon === undefined || !source) {
      setState({ loading: false, spot: null });
      return;
    }

    let active = true;
    setState(current => ({ ...current, loading: true }));
    void postQuery({
      amenities: ['wifi'],
      location: { lat, lon, source },
      radius_meters: 3000,
    })
      .then(response => {
        if (active)
          setState({ loading: false, spot: response.spots.find(spot => spot.has_wifi) ?? null });
      })
      .catch(() => {
        if (active) setState({ loading: false, spot: null });
      });

    return () => {
      active = false;
    };
  }, [lat, lon, source]);

  return state;
};
