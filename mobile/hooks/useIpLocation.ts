import { useEffect, useState } from 'react';
import type { ResolvedLocation } from 'shared';
import { getIpLocation } from '../services/ip-location';

interface IpLocationState {
  loading: boolean;
  location: ResolvedLocation | null;
}

export const useIpLocation = (enabled: boolean): IpLocationState => {
  const [state, setState] = useState<IpLocationState>({ loading: false, location: null });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setState({ loading: true, location: null });
    void getIpLocation()
      .then(location => {
        if (active) setState({ loading: false, location });
      })
      .catch(() => {
        if (active) setState({ loading: false, location: null });
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
};
