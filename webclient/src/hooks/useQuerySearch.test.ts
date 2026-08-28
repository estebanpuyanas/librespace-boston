import { act, renderHook, waitFor } from '@testing-library/react';
import type { QueryResponse } from 'shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useQuerySearch } from './useQuerySearch';
import { postQuery } from '../services/query';

vi.mock('../services/query', () => ({
  postQuery: vi.fn(),
}));

const mockedPostQuery = vi.mocked(postQuery);

const response: QueryResponse = {
  spots: [],
  disclaimers: [],
  resolved_location: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useQuerySearch', () => {
  it('sends the typed query and current language to the backend', async () => {
    mockedPostQuery.mockResolvedValueOnce(response);
    const location = { lat: 42.36, lon: -71.06 };

    const { result } = renderHook(() => useQuerySearch(location, 'es'));

    act(() => {
      result.current.submit('¿Dónde hay wifi gratis?');
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedPostQuery).toHaveBeenCalledWith({
      query: '¿Dónde hay wifi gratis?',
      location,
      language: 'es',
    });
    expect(result.current.data).toEqual(response);
    expect(result.current.submitted).toBe(true);
  });

  it('does not fire a request for a blank query', () => {
    renderHook(() => useQuerySearch({ lat: 42.36, lon: -71.06 }, 'en')).result.current.submit(
      '   ',
    );

    expect(mockedPostQuery).not.toHaveBeenCalled();
  });

  it('surfaces an error instead of calling the backend when location is unresolved', () => {
    const { result } = renderHook(() => useQuerySearch(null, 'en'));

    act(() => {
      result.current.submit('free wifi nearby');
    });

    expect(mockedPostQuery).not.toHaveBeenCalled();
    expect(result.current.submitted).toBe(true);
    expect(result.current.error).toMatch(/location/i);
  });
});
