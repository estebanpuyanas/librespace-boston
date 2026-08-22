import { useEffect, useState } from 'react';
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
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (mapLoaded) return undefined;
    const timeout = setTimeout(() => setShowFallback(true), 4500);
    return () => clearTimeout(timeout);
  }, [mapLoaded]);

  return (
    <View style={styles.shell}>
      {showFallback ? (
        <DemoMap location={location} spots={spots} onDirections={onDirections} />
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: location.lat,
            latitudeDelta: DELTA,
            longitude: location.lon,
            longitudeDelta: DELTA,
          }}
          onMapLoaded={() => setMapLoaded(true)}
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
      )}
      <View style={styles.legend}>
        <Legend color='#C45E3D' label='You' />
        <Legend color='#246A48' label='Top pick' />
        <Legend color='#C58A38' label='Other places' />
      </View>
    </View>
  );
};

interface DemoMapProps extends SpotMapProps {}

const DemoMap = ({ location, onDirections, spots }: DemoMapProps) => (
  <View
    style={styles.demoMap}
    accessibilityLabel='Map preview of your location and suggested places'
  >
    <View style={[styles.road, styles.roadOne]} />
    <View style={[styles.road, styles.roadTwo]} />
    <View style={[styles.road, styles.roadThree]} />
    <View style={styles.water} />
    <Text style={styles.demoArea}>{location.label}</Text>
    <DemoPin color='#C45E3D' label='You' left='43%' top='57%' />
    {spots.slice(0, 4).map((spot, index) => (
      <DemoPin
        color={index === 0 ? '#246A48' : '#C58A38'}
        key={spot.spot_id}
        label={spot.name}
        left={(['64%', '28%', '73%', '19%'] as const)[index]}
        top={(['27%', '36%', '65%', '71%'] as const)[index]}
        onPress={() => onDirections(spot)}
      />
    ))}
    <View style={styles.demoNote}>
      <Text style={styles.demoNoteText}>Map preview · tap a place for directions</Text>
    </View>
  </View>
);

interface DemoPinProps {
  color: string;
  label: string;
  left: `${number}%`;
  onPress?: () => void;
  top: `${number}%`;
}

const DemoPin = ({ color, label, left, onPress, top }: DemoPinProps) => (
  <Pressable
    style={[styles.demoPin, { left, top }]}
    onPress={onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={label}
  >
    <View style={[styles.demoPinDot, { backgroundColor: color }]} />
    <Text numberOfLines={1} style={styles.demoPinLabel}>
      {label}
    </Text>
  </Pressable>
);

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
  demoMap: { backgroundColor: '#E7EBE0', height: 365, overflow: 'hidden', position: 'relative' },
  water: {
    backgroundColor: '#C8E2E0',
    borderTopLeftRadius: 90,
    bottom: -46,
    height: 185,
    position: 'absolute',
    right: -38,
    transform: [{ rotate: '-15deg' }],
    width: '72%',
  },
  road: {
    backgroundColor: '#FCFCF7',
    height: 17,
    opacity: 0.95,
    position: 'absolute',
    width: '125%',
  },
  roadOne: { left: -36, top: 70, transform: [{ rotate: '-16deg' }] },
  roadTwo: { left: -48, top: 193, transform: [{ rotate: '20deg' }] },
  roadThree: { left: -34, top: 282, transform: [{ rotate: '-7deg' }] },
  demoArea: {
    color: '#56685A',
    fontSize: 13,
    fontWeight: '800',
    left: 18,
    letterSpacing: 0.3,
    position: 'absolute',
    top: 16,
  },
  demoPin: { alignItems: 'center', maxWidth: 104, position: 'absolute' },
  demoPinDot: { borderColor: '#FFFFFF', borderRadius: 12, borderWidth: 3, height: 24, width: 24 },
  demoPinLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    color: '#32513E',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 100,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  demoNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 8,
    bottom: 14,
    left: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,
    position: 'absolute',
  },
  demoNoteText: { color: '#526359', fontSize: 10, fontWeight: '700' },
  callout: { maxWidth: 180, padding: 4 },
  calloutName: { color: '#173D2A', fontSize: 14, fontWeight: '800' },
  calloutAction: { color: '#54715C', fontSize: 11, marginTop: 3 },
  legend: { backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 13, padding: 11 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  legendDot: { borderRadius: 5, height: 9, width: 9 },
  legendText: { color: '#4A5A4F', fontSize: 10, fontWeight: '700' },
});
