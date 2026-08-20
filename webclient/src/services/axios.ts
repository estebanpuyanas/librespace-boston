import { setApiBaseUrl } from 'shared/mutator';

// Points the generated client (shared/generated/index.ts) at the backend.
// Import this once for its side effect before making any API calls.
setApiBaseUrl(import.meta.env.VITE_API_URL ?? 'http://localhost:8081');
