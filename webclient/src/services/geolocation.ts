import { Coordinates, CoordinatesSource } from 'shared';

const DEVICE_TIMEOUT_MS = 8000;
const DEVICE_MAX_AGE_MS = 5 * 60 * 1000;

// Triggers the browser's native geolocation permission prompt (if not
// already granted/denied) and resolves precise device coordinates.
export const getDeviceLocation = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation API not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          source: CoordinatesSource.device,
        }),
      error => reject(error),
      { timeout: DEVICE_TIMEOUT_MS, maximumAge: DEVICE_MAX_AGE_MS },
    );
  });

// Coarse, no-permission-required fallback for when the user denies (or
// never gets asked for) device geolocation. ipwho.is is free, keyless, and CORS-enabled.
export const getIpLocation = async (): Promise<Coordinates> => {
  const response = await fetch('https://ipwho.is/');
  if (!response.ok) {
    throw new Error(`IP geolocation request failed: ${response.status}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message ?? 'IP geolocation lookup failed');
  }
  return { lat: data.latitude, lon: data.longitude, source: CoordinatesSource.ip };
};

// Checks prior grant/denial without itself triggering a prompt.
export const getGeolocationPermission = async (): Promise<PermissionState | 'unsupported'> => {
  if (!('permissions' in navigator)) return 'unsupported';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
};
