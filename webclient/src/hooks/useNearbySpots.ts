import { useEffect, useState } from 'react';
import { Coordinates, QueryResponse } from 'shared';
import { postQuery } from '../services/query';
import type { AsyncState } from '../types/types';

const initialState: AsyncState<QueryResponse> = { data: null, loading: false, error: null };

// Fetches the plain "what's near me" spots list (no `query` text, so the
// backend skips LLM synthesis) once a location is available and this is what
// populates the homepage bento grid.
export const useNearbySpots = (location: Coordinates | null): AsyncState<QueryResponse> => {
  const [state, setState] = useState<AsyncState<QueryResponse>>(initialState);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    postQuery({ location })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  return state;
};
