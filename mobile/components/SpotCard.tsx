import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from 'shared';
import type { MobileCopy } from '../content';

interface SpotCardProps {
  copy: MobileCopy;
  onToggleSave: () => void;
  saved: boolean;
  spot: Spot;
}

const formatDistance = (meters: number) => `${(meters / 1609.34).toFixed(1)} mi`;
const formatWalk = (meters: number) => `${Math.max(1, Math.round(meters / 80))} min walk`;

const getTags = (copy: MobileCopy, spot: Spot): string[] =>
  [
    ...(spot.has_wifi ? [copy.publicWifi] : []),
    ...(spot.features.includes('seating') ? [copy.seating] : []),
    ...(spot.features.includes('playground') ? [copy.playground] : []),
    ...(spot.features.includes('restroom') ? [copy.restroom] : []),
  ].slice(0, 3);

export const SpotCard = ({ copy, onToggleSave, saved, spot }: SpotCardProps) => {
  const tags = getTags(copy, spot);
  const openDirections = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=walking`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(copy.directionsUnavailable);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.number}>
          <Text style={styles.numberText}>01</Text>
        </View>
        <Pressable
          onPress={onToggleSave}
          hitSlop={10}
          accessibilityRole='button'
          accessibilityLabel={saved ? copy.savedPlace : copy.savePlace}
        >
          <Text style={styles.saveIcon}>{saved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <Text style={styles.name}>{spot.name}</Text>
      <Text style={styles.distance}>
        {formatDistance(spot.distance_meters)} away · {formatWalk(spot.distance_meters)}
      </Text>
      <Text style={styles.description}>{copy.publicDataDescription}</Text>
      <View style={styles.tagRow}>
        {tags.map(tag => (
          <Text key={tag} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>
      {spot.accessible.value && (
        <View style={styles.evidenceLine}>
          <Text style={styles.evidenceIcon}>✓</Text>
          <Text style={styles.evidenceText}>{copy.verifiedAccessible}</Text>
        </View>
      )}
      <View style={styles.shadeNote}>
        <Text style={styles.shadeIcon}>♣</Text>
        <Text style={styles.shadeText}>{copy.shadeNotice(spot.tree_density_nearby)}</Text>
      </View>
      <Pressable
        style={styles.directionsButton}
        onPress={openDirections}
        accessibilityRole='button'
        accessibilityLabel={`${copy.directions} to ${spot.name}`}
      >
        <Text style={styles.directionsText}>{copy.directions}</Text>
        <Text style={styles.directionsArrow}>→</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#214E37',
    borderRadius: 22,
    marginHorizontal: 17,
    marginTop: 15,
    overflow: 'hidden',
    padding: 21,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  number: {
    borderColor: '#8DBA98',
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  numberText: { color: '#DCEFD9', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  saveIcon: { color: '#F7F5E9', fontSize: 28, lineHeight: 28 },
  name: {
    color: '#FFFFFF',
    fontFamily: 'Georgia',
    fontSize: 29,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginTop: 21,
  },
  distance: { color: '#BED1C1', fontSize: 13, fontWeight: '600', marginTop: 4 },
  description: { color: '#E3EADD', fontSize: 14, lineHeight: 20, marginTop: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15 },
  tag: {
    backgroundColor: '#36674C',
    borderRadius: 13,
    color: '#F0F4E9',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  evidenceLine: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 18 },
  evidenceIcon: { color: '#A6DFAA', fontSize: 15, fontWeight: '800' },
  evidenceText: { color: '#D9E9D9', fontSize: 11, fontWeight: '600' },
  shadeNote: {
    alignItems: 'flex-start',
    backgroundColor: '#2C5A42',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
    padding: 10,
  },
  shadeIcon: { color: '#9ED6A1', fontSize: 13 },
  shadeText: { color: '#D9E4D7', flex: 1, fontSize: 10.5, lineHeight: 15 },
  directionsButton: {
    alignItems: 'center',
    backgroundColor: '#EFF4E7',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  directionsText: { color: '#214E37', fontSize: 14, fontWeight: '800' },
  directionsArrow: { color: '#214E37', fontSize: 19, fontWeight: '700' },
});
