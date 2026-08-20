import Constants from 'expo-constants';
import { setApiBaseUrl } from 'shared/mutator';

const BACKEND_PORT = 8081; // must match backend/.env.example's PORT

// On a physical device "localhost" resolves to the phone itself, not the
// dev machine, so EXPO_PUBLIC_API_URL only works for simulators/emulators
// unless set explicitly. Otherwise, derive the LAN IP from Expo's own dev
// server host (Constants.expoConfig.hostUri, e.g. "192.168.1.23:8082") so
// physical-device testing works with zero per-laptop .env editing.
const resolveApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
};

// Points the generated client (shared/generated/index.ts) at the backend.
// Import this once for its side effect before making any API calls.
setApiBaseUrl(resolveApiUrl());
