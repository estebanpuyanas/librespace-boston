import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { SearchLocation } from '../types/app';
import { getBostonAreaLabel } from '../utils/boston-area';

interface LiveLocationState {
  isLive: boolean;
  location: SearchLocation | null;
}

export const useLiveLocation = (enabled: boolean): LiveLocationState => {
  const [state, setState] = useState<LiveLocationState>({ isLive: false, location: null });

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | undefined;

    if (!enabled) {
      setState({ isLive: false, location: null });
      return undefined;
    }

    const updateLocation = (position: Location.LocationObject) => {
      if (!isMounted) return;
      setState({
        isLive: true,
        location: {
          label: getBostonAreaLabel(position.coords.latitude, position.coords.longitude),
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

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          updateLocation,
        );

        const lastKnownPosition = await Location.getLastKnownPositionAsync();
        if (lastKnownPosition) updateLocation(lastKnownPosition);

        void Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        })
          .then(updateLocation)
          .catch(() => {
            // A watch is already active for a location sent later by the emulator.
          });
      } catch {
        // The app can still request a coarse IP-based location from the backend.
      }
    };

    void startTracking();
    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [enabled]);

  return state;
};
