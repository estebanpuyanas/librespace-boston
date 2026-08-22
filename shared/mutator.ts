import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Every generated call in generated/index.ts is routed through this instance
// (see orval.config.ts's `override.mutator`) instead of bare axios, so a
// single `setApiBaseUrl` call in each app's entry point is enough to point
// the whole generated client at the right backend.
// 60s ceiling accommodates POST /api/query's LLM-synthesis path when `query`
// is present, observed to take ~25-40s against the local CPU-served model
// (see AGENTS.md's LlmClient.kt entry) — the structured-only path is fast
// and unaffected since this is a max wait, not an added delay.
export const client = axios.create({
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export const setApiBaseUrl = (baseUrl: string): void => {
  client.defaults.baseURL = baseUrl;
};

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  client.request<T>(config).then(response => response.data);
