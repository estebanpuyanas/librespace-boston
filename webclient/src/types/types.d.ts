// Client-side type augmentations and convenience aliases.
// Domain types are generated into 'shared' from backend/openapi.yaml. see shared/README.md.

declare global {
  // Vite environment variables, extend this as you add VITE_* vars to .env
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Common UI state shape reused across hooks
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
