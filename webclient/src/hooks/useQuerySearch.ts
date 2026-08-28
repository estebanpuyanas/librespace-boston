import { useCallback, useRef, useState } from 'react';
import { Coordinates, QueryResponse } from 'shared';
import { postQuery } from '../services/query';
import type { AsyncState } from '../types/types';

export interface QuerySearchState extends AsyncState<QueryResponse> {
  submitted: boolean;
}

const initialState: QuerySearchState = {
  data: null,
  loading: false,
  error: null,
  submitted: false,
};

// Fires the free-text search path (`query` present), which is what triggers
// the backend's semantic retrieval + LLM synthesis, unlike useNearbySpots'
// plain "what's near me" bento-grid path (no `query` field).
export const useQuerySearch = (location: Coordinates | null, language?: string | null) => {
  const [state, setState] = useState<QuerySearchState>(initialState);
  const requestId = useRef(0);

  const submit = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // location is required by QueryRequest - surface this visibly (submitted: true,
      // an error) rather than silently swallowing the click, since a prior fix here
      // left the user with zero feedback when geolocation hadn't resolved yet.
      if (!location) {
        setState({
          data: null,
          loading: false,
          error: 'Waiting for your location before we can search.',
          submitted: true,
        });
        return;
      }

      const currentRequest = ++requestId.current;
      setState({ data: null, loading: true, error: null, submitted: true });

      postQuery({ query: trimmed, location, language })
        .then(data => {
          if (currentRequest === requestId.current) {
            setState({ data, loading: false, error: null, submitted: true });
          }
        })
        .catch((err: Error) => {
          if (currentRequest === requestId.current) {
            setState({ data: null, loading: false, error: err.message, submitted: true });
          }
        });
    },
    [location, language],
  );

  const clear = useCallback(() => {
    requestId.current += 1;
    setState(initialState);
  }, []);

  return { ...state, submit, clear };
};
