import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Spot } from 'shared';
import type { SearchLocation } from '../types/app';

interface SpotMapProps {
  location: SearchLocation;
  onDirections: (spot: Spot) => void;
  spots: Spot[];
}

const DELTA = 0.025;

export const SpotMap = ({ location, onDirections, spots }: SpotMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadDelayed, setLoadDelayed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapLoaded) return undefined;
    const timeout = setTimeout(() => setLoadDelayed(true), 15000);
    return () => clearTimeout(timeout);
  }, [mapLoaded, mapAttempt]);

  useEffect(() => {
    if (!mapReady) return;
    mapRef.current?.fitToCoordinates(
      [location, ...spots].map(point => ({ latitude: point.lat, longitude: point.lon })),
      { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: false },
    );
  }, [location, spots, mapReady]);

  return (
    <View style={styles.shell}>
      <MapView
        key={mapAttempt}
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.lat,
          latitudeDelta: DELTA,
          longitude: location.lon,
          longitudeDelta: DELTA,
        }}
        onMapReady={() => setMapReady(true)}
        onMapLoaded={() => {
          setMapLoaded(true);
          setLoadDelayed(false);
        }}
        accessibilityLabel='Map of your location and suggested free places'
      >
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lon }}
          pinColor='#C45E3D'
          title='You are here'
        />
        {spots.map((spot, index) => (
          <Marker
            key={spot.spot_id}
            coordinate={{ latitude: spot.lat, longitude: spot.lon }}
            pinColor={index === 0 ? '#246A48' : '#C58A38'}
            title={spot.name}
            description={index === 0 ? 'Top recommendation' : `Recommendation ${index + 1}`}
          >
            <Callout onPress={() => onDirections(spot)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{spot.name}</Text>
                <Text style={styles.calloutAction}>Tap for walking directions</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {!mapLoaded && (
        <View style={styles.loadingNotice}>
          <Text style={styles.loadingText}>
            {loadDelayed
              ? 'Map is taking longer to load. Check your connection or retry.'
              : 'Loading map…'}
          </Text>
          {loadDelayed && (
            <Pressable
              accessibilityRole='button'
              style={styles.retryButton}
              onPress={() => {
                setMapLoaded(false);
                setMapReady(false);
                setLoadDelayed(false);
                setMapAttempt(attempt => attempt + 1);
              }}
            >
              <Text style={styles.loadingText}>Retry map</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.legend}>
        <Legend color='#C45E3D' label='You' />
        <Legend color='#246A48' label='Top pick' />
        <Legend color='#C58A38' label='Other places' />
      </View>
    </View>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    borderColor: '#D6DBD1',
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 17,
    marginTop: 15,
    overflow: 'hidden',
  },
  map: { height: 365, width: '100%' },
  loadingNotice: { backgroundColor: '#FFFFFF', padding: 12 },
  loadingText: { color: '#32513E', fontSize: 12 },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
  },
  callout: { maxWidth: 180, padding: 4 },
  calloutName: { color: '#173D2A', fontSize: 14, fontWeight: '800' },
  calloutAction: { color: '#54715C', fontSize: 11, marginTop: 3 },
  legend: { backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 13, padding: 11 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  legendDot: { borderRadius: 5, height: 9, width: 9 },
  legendText: { color: '#4A5A4F', fontSize: 10, fontWeight: '700' },
});
