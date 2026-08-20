import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Every generated call in generated/index.ts is routed through this instance
// (see orval.config.ts's `override.mutator`) instead of bare axios, so a
// single `setApiBaseUrl` call in each app's entry point is enough to point
// the whole generated client at the right backend.
export const client = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const setApiBaseUrl = (baseUrl: string): void => {
  client.defaults.baseURL = baseUrl;
};

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  client.request<T>(config).then(response => response.data);
