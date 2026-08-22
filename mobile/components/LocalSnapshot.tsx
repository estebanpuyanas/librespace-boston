import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from 'shared';
import type { MobileCopy } from '../content';
import type { CurrentWeather } from '../hooks/useCurrentWeather';

interface LocalSnapshotProps {
  copy: MobileCopy;
  hasLocation: boolean;
  onAreaPress: () => void;
  onWifiPress: () => void;
  weather: CurrentWeather | null;
  weatherFailed: boolean;
  weatherLoading: boolean;
  wifiLoading: boolean;
  wifiSpot: Spot | null;
}

const weatherLabel = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code in { 1: true, 2: true, 3: true }) return 'Cloudy';
  if (code in { 45: true, 48: true }) return 'Foggy';
  if (
    code in
    { 51: true, 53: true, 55: true, 61: true, 63: true, 65: true, 80: true, 81: true, 82: true }
  )
    return 'Rain';
  if (code in { 71: true, 73: true, 75: true, 85: true, 86: true }) return 'Snow';
  return 'Stormy';
};

export const LocalSnapshot = ({
  copy,
  hasLocation,
  onAreaPress,
  onWifiPress,
  weather,
  weatherFailed,
  weatherLoading,
  wifiLoading,
  wifiSpot,
}: LocalSnapshotProps) => (
  <View style={styles.row}>
    <Pressable
      style={[styles.card, styles.weatherCard]}
      onPress={onAreaPress}
      accessibilityRole='button'
      accessibilityLabel={copy.weather}
    >
      <Text style={styles.eyebrow}>{copy.weather}</Text>
      {weatherLoading ? (
        <Text style={styles.pending}>{copy.loadingShort}</Text>
      ) : weather ? (
        <View style={styles.weatherValue}>
          <Text style={styles.weatherIcon}>{weather.weatherCode === 0 ? '☀' : '☁'}</Text>
          <Text style={styles.temperature}>{weather.temperature}°</Text>
          <Text style={styles.weatherLabel}>{weatherLabel(weather.weatherCode)}</Text>
        </View>
      ) : (
        <Text style={styles.pending}>
          {weatherFailed ? copy.weatherUnavailable : copy.chooseAreaForWeather}
        </Text>
      )}
    </Pressable>
    <Pressable
      style={[styles.card, styles.wifiCard]}
      onPress={wifiSpot ? onWifiPress : onAreaPress}
      accessibilityRole='button'
      accessibilityLabel={wifiSpot ? `${copy.nearestWifi}: ${wifiSpot.name}` : copy.nearestWifi}
    >
      <Text style={styles.eyebrow}>{copy.nearestWifi}</Text>
      {wifiLoading ? (
        <Text style={styles.pending}>{copy.loadingShort}</Text>
      ) : wifiSpot ? (
        <>
          <Text style={styles.wifiName} numberOfLines={1}>
            {wifiSpot.name}
          </Text>
          <Text style={styles.wifiMeta}>
            {(wifiSpot.distance_meters / 1609.34).toFixed(1)} mi away · →
          </Text>
        </>
      ) : (
        <Text style={styles.pending}>
          {hasLocation ? copy.wifiUnavailable : copy.chooseAreaForWifi}
        </Text>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginHorizontal: 22, marginTop: 19 },
  card: { borderRadius: 15, flex: 1, minHeight: 92, padding: 13 },
  weatherCard: { backgroundColor: '#E5ECE0' },
  wifiCard: { backgroundColor: '#E8EAE2' },
  eyebrow: { color: '#748177', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  weatherValue: { alignItems: 'center', flexDirection: 'row', marginTop: 8 },
  weatherIcon: { color: '#C0782F', fontSize: 21, marginRight: 6 },
  temperature: { color: '#234432', fontFamily: 'Georgia', fontSize: 25, fontWeight: '700' },
  weatherLabel: { color: '#587060', fontSize: 11, marginLeft: 5, marginTop: 6 },
  wifiName: { color: '#274934', fontSize: 13, fontWeight: '800', marginTop: 10 },
  wifiMeta: { color: '#617365', fontSize: 10, marginTop: 4 },
  pending: { color: '#66766B', fontSize: 11, lineHeight: 16, marginTop: 11 },
});
