import { useEffect, useState } from 'react';
import { Coordinates } from 'shared';
import { getDeviceLocation, getIpLocation } from '../services/geolocation';
import type { AsyncState } from '../types/types';

const initialState: AsyncState<Coordinates> = { data: null, loading: true, error: null };

// Resolves the user's location for the homepage: try precise device
// geolocation first (prompts if not already granted/denied), and fall back
// to coarse IP-based location on denial, timeout, or an unsupported browser.
export const useGeolocation = (): AsyncState<Coordinates> => {
  const [state, setState] = useState<AsyncState<Coordinates>>(initialState);

  useEffect(() => {
    let cancelled = false;

    const resolveLocation = async () => {
      try {
        const location = await getDeviceLocation();
        if (!cancelled) setState({ data: location, loading: false, error: null });
        return;
      } catch {
        // Denied, timed out, or unsupported, fall back to the IP-based lookup below.
      }

      try {
        const location = await getIpLocation();
        if (!cancelled) setState({ data: location, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: (err as Error).message });
        }
      }
    };

    resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
