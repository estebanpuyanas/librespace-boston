// Client-side type augmentations and convenience aliases.
// For shared domain types (User, Post, etc.) import from 'shared/types/*'.

import { SafeDatabaseUser } from 'shared/types/user';
import { PopulatedDatabasePost, PopulatedComment } from 'shared/types/post';

// Vite environment variables — extend this as you add VITE_* vars to .env
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Common UI state shape reused across hooks
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Narrow type for pagination metadata returned by list endpoints
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Convenience re-exports so components can import from one place
export type { SafeDatabaseUser, PopulatedDatabasePost, PopulatedComment };
