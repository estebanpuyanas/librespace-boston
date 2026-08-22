import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { MobileCopy } from '../content';
import type { AmenityLabel } from '../types/app';

const amenities: AmenityLabel[] = ['Wi-Fi', 'Seating', 'Shade', 'Accessible', 'Playground'];

interface AmenityFiltersProps {
  copy: MobileCopy;
  onToggle: (amenity: AmenityLabel) => void;
  selected: AmenityLabel[];
}

export const AmenityFilters = ({ copy, onToggle, selected }: AmenityFiltersProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
    {amenities.map(amenity => {
      const isSelected = selected.includes(amenity);
      return (
        <Pressable
          key={amenity}
          onPress={() => onToggle(amenity)}
          style={[styles.chip, isSelected && styles.chipSelected]}
          accessibilityRole='button'
          accessibilityState={{ selected: isSelected }}
          hitSlop={4}
        >
          {isSelected && <Text style={styles.check}>✓</Text>}
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {copy.amenityLabels[amenity]}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  list: { gap: 8, paddingBottom: 2, paddingHorizontal: 22, paddingTop: 16 },
  chip: {
    alignItems: 'center',
    backgroundColor: '#ECEDE6',
    borderColor: '#DFE0D5',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: '#DCEADD', borderColor: '#246A48' },
  check: { color: '#246A48', fontSize: 12, fontWeight: '800', marginRight: 5 },
  chipText: { color: '#526458', fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#246A48' },
});
