import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Spot } from 'shared';
import type { SearchLocation } from '../types/app';

interface SpotMapProps {
  location: SearchLocation;
  onDirections: (spot: Spot) => void;
  spots: Spot[];
}

const DELTA = 0.025;

export const SpotMap = ({ location, onDirections, spots }: SpotMapProps) => (
  <View style={styles.shell}>
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={{
        latitude: location.lat,
        latitudeDelta: DELTA,
        longitude: location.lon,
        longitudeDelta: DELTA,
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
    <View style={styles.legend}>
      <Legend color='#C45E3D' label='You' />
      <Legend color='#246A48' label='Top pick' />
      <Legend color='#C58A38' label='Other places' />
    </View>
  </View>
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
  callout: { maxWidth: 180, padding: 4 },
  calloutName: { color: '#173D2A', fontSize: 14, fontWeight: '800' },
  calloutAction: { color: '#54715C', fontSize: 11, marginTop: 3 },
  legend: { backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 13, padding: 11 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  legendDot: { borderRadius: 5, height: 9, width: 9 },
  legendText: { color: '#4A5A4F', fontSize: 10, fontWeight: '700' },
});
