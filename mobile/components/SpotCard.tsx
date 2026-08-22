import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from 'shared';

interface SpotCardProps {
  spot: Spot;
}

const formatDistance = (meters: number) => `${(meters / 1609.34).toFixed(1)} mi`;
const formatWalk = (meters: number) => `${Math.max(1, Math.round(meters / 80))} min walk`;

const getTags = (spot: Spot): string[] =>
  [
    ...(spot.has_wifi ? ['Public Wi-Fi nearby'] : []),
    ...(spot.features.includes('seating') ? ['Seating'] : []),
    ...(spot.features.includes('playground') ? ['Playground'] : []),
    ...(spot.features.includes('restroom') ? ['Restroom'] : []),
  ].slice(0, 3);

export const SpotCard = ({ spot }: SpotCardProps) => {
  const [saved, setSaved] = useState(false);
  const tags = getTags(spot);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.number}>
          <Text style={styles.numberText}>01</Text>
        </View>
        <Pressable
          onPress={() => setSaved(current => !current)}
          hitSlop={10}
          accessibilityRole='button'
          accessibilityLabel={saved ? 'Remove saved place' : 'Save place'}
        >
          <Text style={styles.saveIcon}>{saved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <Text style={styles.name}>{spot.name}</Text>
      <Text style={styles.distance}>
        {formatDistance(spot.distance_meters)} away · {formatWalk(spot.distance_meters)}
      </Text>
      <Text style={styles.description}>
        A free public place with details verified from Boston’s open data.
      </Text>
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
          <Text style={styles.evidenceText}>Accessible park details verified</Text>
        </View>
      )}
      <View style={styles.shadeNote}>
        <Text style={styles.shadeIcon}>♣</Text>
        <Text style={styles.shadeText}>
          {spot.tree_density_nearby} nearby public trees — an approximate shade signal, not canopy
          data.
        </Text>
      </View>
      <Pressable style={styles.directionsButton} accessibilityRole='button'>
        <Text style={styles.directionsText}>Get directions</Text>
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
