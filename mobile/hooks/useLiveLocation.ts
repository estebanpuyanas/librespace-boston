import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { SearchLocation } from '../types/app';

interface LiveLocationState {
  isLive: boolean;
  location: SearchLocation | null;
}

export const useLiveLocation = (): LiveLocationState => {
  const [state, setState] = useState<LiveLocationState>({ isLive: false, location: null });

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | undefined;

    const updateLocation = (position: Location.LocationObject) => {
      if (!isMounted) return;
      setState({
        isLive: true,
        location: {
          label: 'Your live location',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          source: 'device',
        },
      });
    };

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (status !== Location.PermissionStatus.GRANTED || !servicesEnabled) return;

        const lastKnownPosition = await Location.getLastKnownPositionAsync();
        if (lastKnownPosition) updateLocation(lastKnownPosition);

        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          });
          updateLocation(position);
        } catch {
          // Emulators can grant permission without having a simulated GPS fix yet.
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          updateLocation,
        );
      } catch {
        // The app can still request a coarse IP-based location from the backend.
      }
    };

    void startTracking();
    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return state;
};
