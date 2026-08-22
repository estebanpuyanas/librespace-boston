import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from 'shared';
import type { MobileCopy } from '../content';

interface AlternativeSpotRowProps {
  copy: MobileCopy;
  index: number;
  onPress: () => void;
  spot: Spot;
}

export const AlternativeSpotRow = ({ copy, index, onPress, spot }: AlternativeSpotRowProps) => {
  const features = spot.features.map(feature => {
    const labels: Record<string, string> = {
      playground: copy.playground,
      restroom: copy.restroom,
      seating: copy.seating,
      shade_structure: copy.amenityLabels.Shade,
    };
    return labels[feature] ?? feature.replace('_', ' ');
  });
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`${spot.name}, ${copy.directions}`}
    >
      <View style={styles.index}>
        <Text style={styles.indexText}>{String(index).padStart(2, '0')}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{spot.name}</Text>
        <Text style={styles.meta}>
          {(spot.distance_meters / 1609.34).toFixed(1)} mi ·{' '}
          {features.slice(0, 2).join(' · ') || 'Public open space'}
        </Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#DADCD3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 22,
    minHeight: 63,
    paddingVertical: 12,
  },
  index: {
    alignItems: 'center',
    backgroundColor: '#E4E8DC',
    borderRadius: 14,
    height: 31,
    justifyContent: 'center',
    marginRight: 11,
    width: 31,
  },
  indexText: { color: '#54715C', fontSize: 10, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: '#1F3D2D', fontSize: 15, fontWeight: '800' },
  meta: { color: '#6B796E', fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  arrow: { color: '#52725A', fontSize: 20 },
});
